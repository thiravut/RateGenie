import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";

export async function POST() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const code = crypto.randomBytes(3).toString("hex").toUpperCase();

  // Delete old verification codes for this user/channel
  await prisma.verificationCode.deleteMany({
    where: { userId: session!.user.id, channel: "line" },
  });

  await prisma.verificationCode.create({
    data: {
      userId: session!.user.id,
      channel: "line",
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  // Update notification channel preference
  await prisma.user.update({
    where: { id: session!.user.id },
    data: { notificationChannel: "LINE" },
  });

  const lineId = process.env.LINE_BOT_ID || "@rategenie";

  return NextResponse.json({
    connectUrl: `https://line.me/R/ti/p/${lineId}`,
    verificationCode: code,
    message: `กรุณาเพิ่มเพื่อน LINE แล้วส่งรหัส ${code}`,
  });
}
