import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { withRetry } from "@/utils/retry";

interface DiscoveredCompetitor {
  name: string;
  location: string;
  starRating: number;
  roomTypes: string[];
  description: string;
}

/**
 * ใช้ Gemini ค้นหาโรงแรมคู่แข่งจริงในย่านเดียวกัน
 * หมายเหตุ: ราคาจาก Gemini ไม่แม่นยำ — ใช้เฉพาะชื่อ + ข้อมูลพื้นฐาน
 */
export async function discoverCompetitors(
  hotelName: string,
  location: string,
  starRating: number,
  totalRooms: number
): Promise<DiscoveredCompetitor[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.info("[DEMO] Competitor discovery skipped — no GEMINI_API_KEY");
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `ค้นหาโรงแรมคู่แข่งของ "${hotelName}" ในย่าน ${location}

ข้อมูลโรงแรมของเรา:
- ระดับดาว: ${starRating} ดาว
- จำนวนห้อง: ${totalRooms} ห้อง
- ที่ตั้ง: ${location}

กรุณาค้นหาโรงแรมจริงที่เป็นคู่แข่งโดยตรง:
- ระดับดาวใกล้เคียง (±1 ดาว)
- อยู่ในย่านเดียวกันหรือใกล้เคียง
- ขนาดใกล้เคียง
- เป็นโรงแรมที่มีอยู่จริง มีชื่อจริง (ห้ามสมมติ)

ตอบเป็น JSON array เท่านั้น (ไม่ต้องมี markdown code block):
[
  {
    "name": "ชื่อโรงแรมจริง",
    "location": "ที่ตั้งย่อ",
    "starRating": 4,
    "roomTypes": ["Deluxe Room", "Superior Room", "Suite"],
    "description": "คำอธิบายสั้นๆ เป็นภาษาไทย เช่น โรงแรมริมหาด 120 ห้อง"
  }
]

ให้ข้อมูล 8-10 โรงแรม`;

  try {
    const text = await withRetry(
      async () => {
        const result = await model.generateContent(prompt);
        return result.response.text();
      },
      { context: "gemini_discover_competitors", maxRetries: 2 }
    );

    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as DiscoveredCompetitor[];

    logger.info("Competitors discovered via Gemini", {
      hotelName,
      location,
      count: parsed.length,
    });

    return parsed;
  } catch (error) {
    logger.error("Competitor discovery failed", {
      hotelName,
      location,
      error: String(error),
    });
    return [];
  }
}

/**
 * ค้นหาคู่แข่ง + บันทึกลง DB (เจ้าของเลือกทีหลังว่าจะ track โรงแรมไหน)
 */
export async function discoverAndSaveCompetitors(hotelId: string): Promise<{
  discovered: DiscoveredCompetitor[];
  saved: number;
}> {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) return { discovered: [], saved: 0 };

  const discovered = await discoverCompetitors(
    hotel.name,
    hotel.location ?? "ไทย",
    4, // default star rating
    hotel.totalRooms
  );

  if (discovered.length === 0) return { discovered, saved: 0 };

  // Save to DB (ยังไม่ track ราคา — แค่เก็บรายชื่อ)
  let saved = 0;
  for (const comp of discovered) {
    // Check if already exists
    const existing = await prisma.competitor.findFirst({
      where: { hotelId, name: comp.name },
    });
    if (existing) continue;

    await prisma.competitor.create({
      data: {
        hotelId,
        name: comp.name,
        location: comp.location,
        starRating: comp.starRating,
        source: "gemini",
      },
    });
    saved++;
  }

  logger.info("Competitors saved", { hotelId, discovered: discovered.length, saved });

  return { discovered, saved };
}
