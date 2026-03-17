import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { RULE_TEMPLATES } from "@/lib/rules/engine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "REVENUE_MANAGER"]
  );
  if (accessError) return accessError;

  const rules = await prisma.pricingRule.findMany({
    where: { hotelId },
    include: {
      _count: { select: { executions: true } },
    },
    orderBy: { priority: "desc" },
  });

  // Get recent executions count per rule
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return NextResponse.json({
    data: rules.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      enabled: r.enabled,
      priority: r.priority,
      roomTypeIds: r.roomTypeIds,
      conditions: r.conditions,
      action: r.action,
      template: r.template,
      totalExecutions: r._count.executions,
      createdAt: r.createdAt,
    })),
    templates: RULE_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      conditions: t.conditions,
      action: t.action,
    })),
  });
}

const createRuleSchema = z.object({
  name: z.string().min(1, "กรุณาตั้งชื่อกฎ"),
  description: z.string().optional(),
  priority: z.number().int().min(0).optional(),
  roomTypeIds: z.array(z.string()).optional(),
  conditions: z.array(z.object({
    metric: z.string(),
    operator: z.string(),
    value: z.any(),
  })),
  action: z.object({
    type: z.literal("adjust_price"),
    direction: z.enum(["up", "down"]),
    amount: z.number().positive(),
    unit: z.enum(["percent", "baht"]),
  }),
  template: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = createRuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const rule = await prisma.pricingRule.create({
      data: {
        hotelId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority ?? 0,
        roomTypeIds: parsed.data.roomTypeIds ?? [],
        conditions: parsed.data.conditions as any,
        action: parsed.data.action as any,
        template: parsed.data.template ?? null,
      },
    });

    logger.info("Pricing rule created", {
      userId: session!.user.id,
      hotelId,
      ruleId: rule.id,
      action: "create_rule",
    });

    return NextResponse.json(
      { message: "สร้างกฎสำเร็จ", rule },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Rule creation failed", { error: String(err) });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
