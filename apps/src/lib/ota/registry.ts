/**
 * OTA Registry — เพิ่ม OTA ใหม่โดยเพิ่ม entry ใน OTA_REGISTRY เท่านั้น
 * ไม่ต้องเขียน adapter code ใหม่ เพราะทุก OTA ผ่าน Channex single API
 */

export interface OtaConfig {
  id: string;           // unique key ใน database (lowercase)
  name: string;         // display name
  brandColor: string;   // hex color
  brandColorLight: string;
  logoEmoji: string;    // placeholder ก่อนมี logo จริง
  channexPlatformId: string; // Channex platform identifier
  market: string[];     // target markets
  phase: "mvp-0" | "mvp-1" | "growth";
  enabled: boolean;
}

export const OTA_REGISTRY: OtaConfig[] = [
  // MVP-0
  {
    id: "agoda",
    name: "Agoda",
    brandColor: "#FF5A00",
    brandColorLight: "#FFF3ED",
    logoEmoji: "🟠",
    channexPlatformId: "agoda",
    market: ["th", "sea", "global"],
    phase: "mvp-0",
    enabled: true,
  },
  {
    id: "booking",
    name: "Booking.com",
    brandColor: "#003580",
    brandColorLight: "#E8EFF8",
    logoEmoji: "🔵",
    channexPlatformId: "booking_com",
    market: ["global"],
    phase: "mvp-0",
    enabled: true,
  },
  // MVP-1
  {
    id: "expedia",
    name: "Expedia",
    brandColor: "#FBCC33",
    brandColorLight: "#FFF9E6",
    logoEmoji: "🟡",
    channexPlatformId: "expedia",
    market: ["global", "us"],
    phase: "mvp-1",
    enabled: true,
  },
  {
    id: "traveloka",
    name: "Traveloka",
    brandColor: "#0064D2",
    brandColorLight: "#E6F0FA",
    logoEmoji: "🔷",
    channexPlatformId: "traveloka",
    market: ["sea", "th"],
    phase: "mvp-1",
    enabled: true,
  },
  {
    id: "trip_com",
    name: "Trip.com",
    brandColor: "#287DFA",
    brandColorLight: "#E8F1FE",
    logoEmoji: "🌐",
    channexPlatformId: "trip_com",
    market: ["cn", "global"],
    phase: "mvp-1",
    enabled: true,
  },
  // Growth (disabled by default)
  {
    id: "airbnb",
    name: "Airbnb",
    brandColor: "#FF385C",
    brandColorLight: "#FFE8EC",
    logoEmoji: "🏠",
    channexPlatformId: "airbnb",
    market: ["global"],
    phase: "growth",
    enabled: false,
  },
  {
    id: "klook",
    name: "Klook",
    brandColor: "#FF5722",
    brandColorLight: "#FFF0EB",
    logoEmoji: "🎫",
    channexPlatformId: "klook",
    market: ["sea", "cn"],
    phase: "growth",
    enabled: false,
  },
];

/** Get all enabled OTAs */
export function getEnabledOTAs(): OtaConfig[] {
  return OTA_REGISTRY.filter((ota) => ota.enabled);
}

/** Get OTA config by ID */
export function getOtaConfig(otaId: string): OtaConfig | undefined {
  return OTA_REGISTRY.find(
    (ota) => ota.id === otaId.toLowerCase() || ota.name.toLowerCase() === otaId.toLowerCase()
  );
}

/** Get OTA brand color */
export function getOtaBrandColor(otaId: string): string {
  return getOtaConfig(otaId)?.brandColor ?? "#6c757d";
}

/** Get OTA display name */
export function getOtaDisplayName(otaId: string): string {
  return getOtaConfig(otaId)?.name ?? otaId;
}

/** Get OTAs by phase */
export function getOtasByPhase(phase: OtaConfig["phase"]): OtaConfig[] {
  return OTA_REGISTRY.filter((ota) => ota.phase === phase);
}
