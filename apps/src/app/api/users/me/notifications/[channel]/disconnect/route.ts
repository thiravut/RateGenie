import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { channel } = await params;

  if (channel !== "line" && channel !== "telegram") {
    return NextResponse.json(
      { error: "Channel ไม่ถูกต้อง", code: "INVALID_CHANNEL" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (channel === "line") {
    updateData.lineUserId = null;
  } else {
    updateData.telegramChatId = null;
  }
  updateData.notificationChannel = null;

  await prisma.user.update({
    where: { id: session!.user.id },
    data: updateData,
  });

  const label = channel === "line" ? "LINE" : "Telegram";

  return NextResponse.json({
    message: `ยกเลิกการเชื่อมต่อ ${label} สำเร็จ`,
  });
}
