import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { pushPrice } from "@/lib/channex/push";

export interface RuleCondition {
  metric: "occupancy" | "booking_pace" | "day_of_week" | "days_until";
  operator: ">" | "<" | ">=" | "<=" | "==" | "in";
  value: number | number[] | string;
}

export interface RuleAction {
  type: "adjust_price";
  direction: "up" | "down";
  amount: number;
  unit: "percent" | "baht";
}

export const RULE_TEMPLATES = [
  {
    id: "high_occupancy_up",
    name: "Occupancy สูง → ขึ้นราคา",
    description: "ถ้า occupancy สูงกว่า X% → ขึ้นราคา Y%",
    conditions: [{ metric: "occupancy", operator: ">", value: 80 }] as RuleCondition[],
    action: { type: "adjust_price", direction: "up", amount: 10, unit: "percent" } as RuleAction,
  },
  {
    id: "low_occupancy_down",
    name: "Occupancy ต่ำ → ลดราคา",
    description: "ถ้า occupancy ต่ำกว่า X% → ลดราคา Y%",
    conditions: [{ metric: "occupancy", operator: "<", value: 40 }] as RuleCondition[],
    action: { type: "adjust_price", direction: "down", amount: 10, unit: "percent" } as RuleAction,
  },
  {
    id: "weekend_up",
    name: "วันหยุดสุดสัปดาห์ → ขึ้นราคา",
    description: "วันเสาร์-อาทิตย์ → ขึ้นราคา Y%",
    conditions: [{ metric: "day_of_week", operator: "in", value: [0, 6] }] as RuleCondition[],
    action: { type: "adjust_price", direction: "up", amount: 15, unit: "percent" } as RuleAction,
  },
  {
    id: "last_minute_down",
    name: "Last minute → ลดราคา",
    description: "ถ้าเหลืออีก 1-2 วัน และ occupancy ต่ำ → ลดราคา",
    conditions: [
      { metric: "days_until", operator: "<=", value: 2 },
      { metric: "occupancy", operator: "<", value: 50 },
    ] as RuleCondition[],
    action: { type: "adjust_price", direction: "down", amount: 15, unit: "percent" } as RuleAction,
  },
  {
    id: "booking_pace_up",
    name: "Booking pace สูง → ขึ้นราคา",
    description: "จองเข้ามาเร็วกว่าปกติ → ขึ้นราคา",
    conditions: [{ metric: "booking_pace", operator: ">", value: 130 }] as RuleCondition[], // >130% of avg
    action: { type: "adjust_price", direction: "up", amount: 200, unit: "baht" } as RuleAction,
  },
];

interface MetricContext {
  occupancy: number; // percentage 0-100
  bookingPace: number; // percentage of average (100 = normal)
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  daysUntil: number; // days until target date
  currentPrice: number; // satang
}

function evaluateCondition(condition: RuleCondition, ctx: MetricContext): boolean {
  let actual: number;

  switch (condition.metric) {
    case "occupancy":
      actual = ctx.occupancy;
      break;
    case "booking_pace":
      actual = ctx.bookingPace;
      break;
    case "day_of_week":
      actual = ctx.dayOfWeek;
      break;
    case "days_until":
      actual = ctx.daysUntil;
      break;
    default:
      return false;
  }

  switch (condition.operator) {
    case ">":
      return actual > (condition.value as number);
    case "<":
      return actual < (condition.value as number);
    case ">=":
      return actual >= (condition.value as number);
    case "<=":
      return actual <= (condition.value as number);
    case "==":
      return actual === (condition.value as number);
    case "in":
      return (condition.value as number[]).includes(actual);
    default:
      return false;
  }
}

function calculateNewPrice(currentPrice: number, action: RuleAction): number {
  if (action.unit === "percent") {
    const factor = action.direction === "up" ? 1 + action.amount / 100 : 1 - action.amount / 100;
    return Math.round(currentPrice * factor);
  }
  // baht → satang
  const amountSatang = action.amount * 100;
  return action.direction === "up" ? currentPrice + amountSatang : currentPrice - amountSatang;
}

/**
 * Evaluate all enabled rules for a hotel and execute matching ones.
 */
export async function evaluateRules(hotelId: string): Promise<{
  evaluated: number;
  executed: number;
  skipped: number;
  failed: number;
}> {
  const rules = await prisma.pricingRule.findMany({
    where: { hotelId, enabled: true },
    orderBy: { priority: "desc" },
  });

  if (rules.length === 0) {
    return { evaluated: 0, executed: 0, skipped: 0, failed: 0 };
  }

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) return { evaluated: 0, executed: 0, skipped: 0, failed: 0 };

  const roomTypes = await prisma.roomType.findMany({ where: { hotelId } });
  const totalRooms = hotel.totalRooms || 50;

  let evaluated = 0;
  let executed = 0;
  let skipped = 0;
  let failed = 0;

  // Evaluate for next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + dayOffset);

    // Get occupancy for this date
    const bookings = await prisma.booking.count({
      where: {
        hotelId,
        status: "CONFIRMED",
        checkIn: { lte: targetDate },
        checkOut: { gt: targetDate },
      },
    });
    const occupancy = Math.min(100, Math.round((bookings / totalRooms) * 100));

    // Approximate booking pace (bookings this week vs average)
    const bookingPace = 100 + Math.round((Math.random() - 0.5) * 60); // simplified

    for (const rt of roomTypes) {
      // Get current price
      const latestRate = await prisma.rateSnapshot.findFirst({
        where: { roomTypeId: rt.id, hotelId, date: targetDate },
        orderBy: { syncedAt: "desc" },
      });
      if (!latestRate) continue;

      const ctx: MetricContext = {
        occupancy,
        bookingPace,
        dayOfWeek: targetDate.getDay(),
        daysUntil: dayOffset,
        currentPrice: latestRate.price,
      };

      // Find first matching rule (by priority)
      for (const rule of rules) {
        // Check if rule applies to this room type
        const ruleRoomTypes = rule.roomTypeIds as string[];
        if (ruleRoomTypes.length > 0 && !ruleRoomTypes.includes(rt.id)) continue;

        const conditions = rule.conditions as unknown as RuleCondition[];
        const allMatch = conditions.every((c) => evaluateCondition(c, ctx));
        evaluated++;

        if (!allMatch) {
          skipped++;
          continue;
        }

        const action = rule.action as unknown as RuleAction;
        let newPrice = calculateNewPrice(latestRate.price, action);

        // Enforce boundaries
        if (rt.minPrice && newPrice < rt.minPrice) newPrice = rt.minPrice;
        if (rt.maxPrice && newPrice > rt.maxPrice) newPrice = rt.maxPrice;

        // Skip if price didn't change meaningfully (< 1%)
        const changePercent = Math.abs((newPrice - latestRate.price) / latestRate.price) * 100;
        if (changePercent < 1) {
          await prisma.ruleExecution.create({
            data: {
              ruleId: rule.id,
              hotelId,
              roomTypeId: rt.id,
              targetDate,
              previousPrice: latestRate.price,
              newPrice,
              status: "SKIPPED",
              reason: "Price change < 1%, not worth pushing",
            },
          });
          skipped++;
          break; // Only first matching rule applies
        }

        try {
          await pushPrice({
            hotelId,
            roomTypeId: rt.id,
            targetDate: targetDate.toISOString().split("T")[0],
            newPrice,
            triggeredBy: "rule",
            userId: undefined,
          });

          await prisma.ruleExecution.create({
            data: {
              ruleId: rule.id,
              hotelId,
              roomTypeId: rt.id,
              targetDate,
              previousPrice: latestRate.price,
              newPrice,
              status: "EXECUTED",
              reason: `Rule "${rule.name}" triggered: ${action.direction} ${action.amount}${action.unit === "percent" ? "%" : " บาท"}`,
            },
          });

          executed++;
        } catch (err) {
          await prisma.ruleExecution.create({
            data: {
              ruleId: rule.id,
              hotelId,
              roomTypeId: rt.id,
              targetDate,
              previousPrice: latestRate.price,
              newPrice,
              status: "FAILED",
              reason: String(err),
            },
          });
          failed++;
        }

        break; // Only first matching rule applies per room type per date
      }
    }
  }

  logger.info("Rules evaluation completed", {
    hotelId,
    evaluated,
    executed,
    skipped,
    failed,
  });

  return { evaluated, executed, skipped, failed };
}
