import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { pushPrice } from "@/lib/channex/push";

const batchSchema = z.object({
  recommendationIds: z.array(z.string().uuid()).min(1),
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
    ["OWNER", "REVENUE_MANAGER"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ถูกต้อง", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { recommendationIds } = parsed.data;
    const results: { id: string; status: string; push?: { success: boolean; otaResults: { otaName: string; success: boolean }[] } }[] = [];
    let approved = 0;
    let failed = 0;
    let pushSuccessCount = 0;
    let pushFailCount = 0;

    for (const id of recommendationIds) {
      const rec = await prisma.recommendation.findFirst({
        where: { id, hotelId, status: "PENDING" },
      });

      if (!rec || new Date() > rec.expiresAt) {
        results.push({ id, status: "failed" });
        failed++;
        continue;
      }

      await prisma.recommendation.update({
        where: { id },
        data: {
          status: "APPROVED",
          decidedAt: new Date(),
          decidedById: session!.user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          hotelId,
          userId: session!.user.id,
          action: "recommendation_approved",
          entityType: "Recommendation",
          entityId: id,
        },
      });

      // Auto-push price to OTAs
      try {
        const pushResult = await pushPrice({
          hotelId,
          roomTypeId: rec.roomTypeId,
          targetDate: rec.targetDate.toISOString().split("T")[0],
          newPrice: rec.recommendedPrice,
          triggeredBy: "recommendation_approve",
          recommendationId: rec.id,
          userId: session!.user.id,
        });

        if (pushResult.success) pushSuccessCount++;
        else pushFailCount++;

        results.push({
          id,
          status: "approved",
          push: {
            success: pushResult.success,
            otaResults: pushResult.otaResults,
          },
        });
      } catch {
        pushFailCount++;
        results.push({ id, status: "approved", push: { success: false, otaResults: [] } });
      }

      approved++;
    }

    logger.info("Batch approve + push completed", {
      userId: session!.user.id,
      hotelId,
      action: "batch_approve_push",
      approved,
      failed,
      pushSuccess: pushSuccessCount,
      pushFail: pushFailCount,
    });

    return NextResponse.json({
      message: `อนุมัติ ${approved} รายการ — push สำเร็จ ${pushSuccessCount}, ล้มเหลว ${pushFailCount}`,
      approved,
      failed,
      pushSummary: {
        success: pushSuccessCount,
        failed: pushFailCount,
      },
      results,
    });
  } catch (err) {
    logger.error("Batch approve failed", {
      userId: session!.user.id,
      hotelId,
      action: "batch_approve",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
