import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number };
  };
}

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json();

    if (update.message?.text) {
      const text = update.message.text.trim().toUpperCase();
      const chatId = String(update.message.chat.id);

      // Handle /start command
      if (text === "/START") {
        try {
          await sendTelegramMessage(
            chatId,
            "สวัสดี! กรุณาส่งรหัสยืนยันที่ได้จากเว็บ RateGenie เพื่อเชื่อมต่อบัญชี"
          );
        } catch {
          // Best effort
        }
        return NextResponse.json({ received: true });
      }

      // Check verification code
      const verification = await prisma.verificationCode.findFirst({
        where: {
          code: text,
          channel: "telegram",
          expiresAt: { gt: new Date() },
        },
      });

      if (verification) {
        await prisma.user.update({
          where: { id: verification.userId },
          data: { telegramChatId: chatId },
        });

        await prisma.verificationCode.delete({
          where: { id: verification.id },
        });

        try {
          await sendTelegramMessage(
            chatId,
            "เชื่อมต่อ RateGenie สำเร็จ! คุณจะได้รับแจ้งเตือนคำแนะนำราคาผ่าน Telegram"
          );
        } catch {
          // Best effort
        }

        logger.info("Telegram connected via verification", {
          userId: verification.userId,
          action: "telegram_verified",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Telegram webhook error", {
      action: "telegram_webhook_error",
      error: String(err),
    });
    return NextResponse.json({ received: true });
  }
}
