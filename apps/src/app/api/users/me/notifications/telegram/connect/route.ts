import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const code = crypto.randomBytes(3).toString("hex").toUpperCase();

  await prisma.verificationCode.deleteMany({
    where: { userId: session!.user.id, channel: "telegram" },
  });

  await prisma.verificationCode.create({
    data: {
      userId: session!.user.id,
      channel: "telegram",
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: session!.user.id },
    data: { notificationChannel: "TELEGRAM" },
  });

  const botName = process.env.TELEGRAM_BOT_NAME || "RateGenieBot";

  return NextResponse.json({
    botUrl: `https://t.me/${botName}`,
    verificationCode: code,
    message: `กรุณาเปิด Telegram bot แล้วส่งรหัส ${code}`,
  });
}
