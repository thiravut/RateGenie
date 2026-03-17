import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { sendLineMessage } from "@/lib/notifications/line";

interface LineEvent {
  type: string;
  source: { userId: string; type: string };
  message?: { type: string; text: string };
}

export async function POST(request: Request) {
  try {
    // TODO: verify LINE webhook signature with LINE_CHANNEL_SECRET
    const body = await request.json();
    const events: LineEvent[] = body.events ?? [];

    for (const event of events) {
      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text.trim().toUpperCase();
        const lineUserId = event.source.userId;

        // Check if this is a verification code
        const verification = await prisma.verificationCode.findFirst({
          where: {
            code: text,
            channel: "line",
            expiresAt: { gt: new Date() },
          },
        });

        if (verification) {
          await prisma.user.update({
            where: { id: verification.userId },
            data: { lineUserId },
          });

          await prisma.verificationCode.delete({
            where: { id: verification.id },
          });

          // Send welcome message
          try {
            await sendLineMessage(
              lineUserId,
              "เชื่อมต่อ RateGenie สำเร็จ! คุณจะได้รับแจ้งเตือนคำแนะนำราคาผ่าน LINE"
            );
          } catch {
            // Best effort
          }

          logger.info("LINE connected via verification", {
            userId: verification.userId,
            action: "line_verified",
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("LINE webhook error", {
      action: "line_webhook_error",
      error: String(err),
    });
    return NextResponse.json({ received: true });
  }
}
