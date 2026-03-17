import { NextResponse } from "next/server";
import { getEnabledOTAs } from "@/lib/ota/registry";

export async function GET() {
  const otas = getEnabledOTAs().map((ota) => ({
    id: ota.id,
    name: ota.name,
    brandColor: ota.brandColor,
    brandColorLight: ota.brandColorLight,
    logoEmoji: ota.logoEmoji,
    market: ota.market,
    phase: ota.phase,
  }));

  return NextResponse.json({ data: otas });
}
