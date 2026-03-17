import { NextResponse } from "next/server";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { discoverAndSaveCompetitors } from "@/lib/competitors/discover";

export async function POST(
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

  const result = await discoverAndSaveCompetitors(hotelId);

  if (result.discovered.length === 0) {
    return NextResponse.json(
      {
        message: "ไม่สามารถค้นหาคู่แข่งได้ — กรุณาตรวจสอบว่าตั้งค่า GEMINI_API_KEY แล้ว",
        discovered: [],
        saved: 0,
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    message: `พบโรงแรมคู่แข่ง ${result.discovered.length} แห่ง บันทึกใหม่ ${result.saved} แห่ง`,
    discovered: result.discovered,
    saved: result.saved,
  });
}
