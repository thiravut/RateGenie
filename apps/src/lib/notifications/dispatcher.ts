import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import {
  sendLineMessage,
  sendLineFlexMessage,
  buildRecommendationFlex,
} from "./line";
import { sendTelegramMessage, sendTelegramWithButtons } from "./telegram";

const APP_URL = process.env.NEXTAUTH_URL || "https://app.rategenie.co";
const MAX_NOTIFICATIONS_PER_DAY = 2;

async function canSendNotification(userId: string): Promise<boolean> {
  // Throttle: max 2 notifications per day per user
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Simple throttle using audit log
  const sentToday = await prisma.auditLog.count({
    where: {
      userId,
      action: { startsWith: "notification_sent" },
      createdAt: { gte: today },
    },
  });

  return sentToday < MAX_NOTIFICATIONS_PER_DAY;
}

export async function notifyNewRecommendations(
  hotelId: string,
  count: number
) {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) return;

  // Get all users with access to this hotel
  const hotelUsers = await prisma.hotelUser.findMany({
    where: { hotelId, role: { in: ["OWNER", "REVENUE_MANAGER"] } },
    include: { user: true },
  });

  const approveUrl = `${APP_URL}/recommendations`;

  for (const hu of hotelUsers) {
    const user = hu.user;
    if (!(await canSendNotification(user.id))) continue;

    try {
      if (user.notificationChannel === "LINE" && user.lineUserId) {
        const flex = buildRecommendationFlex(count, hotel.name, approveUrl);
        await sendLineFlexMessage(
          user.lineUserId,
          `RateGenie: คำแนะนำราคาใหม่ ${count} รายการ`,
          flex
        );
      } else if (
        user.notificationChannel === "TELEGRAM" &&
        user.telegramChatId
      ) {
        await sendTelegramWithButtons(
          user.telegramChatId,
          `<b>RateGenie</b>\n\nคำแนะนำราคาใหม่ <b>${count}</b> รายการ\nโรงแรม: ${hotel.name}\n\nกดปุ่มด้านล่างเพื่อดูรายละเอียด`,
          [{ text: "ดูคำแนะนำ", url: approveUrl }]
        );
      } else {
        // No channel configured — fallback to web dashboard only
        continue;
      }

      // Log notification sent
      await prisma.auditLog.create({
        data: {
          hotelId,
          userId: user.id,
          action: "notification_sent_recommendation",
          entityType: "Notification",
          entityId: hotelId,
        },
      });
    } catch (error) {
      logger.error("Failed to send notification", {
        userId: user.id,
        hotelId,
        action: "notification_failed",
        channel: user.notificationChannel ?? "none",
        error: String(error),
      });
    }
  }
}

export async function notifySyncFailure(
  hotelId: string,
  otaName: string,
  lastSyncAt: Date | null
) {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) return;

  // Throttle: check if same alert was sent within last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAlert = await prisma.auditLog.findFirst({
    where: {
      hotelId,
      action: "notification_sent_sync_failure",
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentAlert) return;

  const hotelUsers = await prisma.hotelUser.findMany({
    where: { hotelId, role: "OWNER" },
    include: { user: true },
  });

  const label = otaName === "agoda" ? "Agoda" : "Booking.com";
  const lastSync = lastSyncAt
    ? lastSyncAt.toLocaleString("th-TH")
    : "ไม่เคย sync";

  const settingsUrl = `${APP_URL}/hotels`;
  const message = `⚠️ OTA Sync ล้มเหลว\n\nโรงแรม: ${hotel.name}\nOTA: ${label}\nSync สำเร็จล่าสุด: ${lastSync}\n\nกรุณาตรวจสอบการเชื่อมต่อ`;

  for (const hu of hotelUsers) {
    const user = hu.user;

    try {
      if (user.notificationChannel === "LINE" && user.lineUserId) {
        await sendLineMessage(user.lineUserId, message);
      } else if (
        user.notificationChannel === "TELEGRAM" &&
        user.telegramChatId
      ) {
        await sendTelegramWithButtons(
          user.telegramChatId,
          `<b>⚠️ OTA Sync ล้มเหลว</b>\n\nโรงแรม: ${hotel.name}\nOTA: ${label}\nSync สำเร็จล่าสุด: ${lastSync}`,
          [{ text: "ตรวจสอบการเชื่อมต่อ", url: settingsUrl }]
        );
      }
    } catch (error) {
      logger.error("Failed to send sync failure notification", {
        userId: user.id,
        hotelId,
        action: "notification_sync_failure_failed",
        error: String(error),
      });
    }
  }

  // Log that we sent this alert
  await prisma.auditLog.create({
    data: {
      hotelId,
      action: "notification_sent_sync_failure",
      entityType: "Notification",
      entityId: hotelId,
      details: JSON.parse(JSON.stringify({ otaName, lastSyncAt })),
    },
  });
}

export async function notifySyncRecovery(
  hotelId: string,
  otaName: string
) {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) return;

  const hotelUsers = await prisma.hotelUser.findMany({
    where: { hotelId, role: "OWNER" },
    include: { user: true },
  });

  const label = otaName === "agoda" ? "Agoda" : "Booking.com";
  const message = `✅ OTA Sync กลับมาปกติแล้ว\n\nโรงแรม: ${hotel.name}\nOTA: ${label}`;

  for (const hu of hotelUsers) {
    const user = hu.user;

    try {
      if (user.notificationChannel === "LINE" && user.lineUserId) {
        await sendLineMessage(user.lineUserId, message);
      } else if (
        user.notificationChannel === "TELEGRAM" &&
        user.telegramChatId
      ) {
        await sendTelegramMessage(user.telegramChatId, message);
      }
    } catch (error) {
      logger.error("Failed to send recovery notification", {
        userId: user.id,
        hotelId,
        action: "notification_recovery_failed",
        error: String(error),
      });
    }
  }
}
