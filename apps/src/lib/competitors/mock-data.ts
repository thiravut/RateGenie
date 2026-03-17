/**
 * Demo competitor data — realistic Thai hotel competitors.
 * In production, this would come from a data provider (RateGain, OTA Insight, etc.)
 */

export interface MockCompetitor {
  name: string;
  location: string;
  starRating: number;
  rates: {
    roomType: string;
    otaName: string;
    dateOffset: number; // days from today
    price: number; // baht
  }[];
}

export function generateMockCompetitors(): MockCompetitor[] {
  return [
    {
      name: "The Royal Palm Resort",
      location: "ภูเก็ต",
      starRating: 4,
      rates: generateRates(2600, 4200, 0.15),
    },
    {
      name: "Andaman Breeze Hotel",
      location: "ภูเก็ต",
      starRating: 3,
      rates: generateRates(1800, 3200, 0.12),
    },
    {
      name: "Sea Pearl Boutique",
      location: "ภูเก็ต",
      starRating: 4,
      rates: generateRates(2800, 4800, 0.18),
    },
    {
      name: "Phuket Garden Inn",
      location: "ภูเก็ต",
      starRating: 3,
      rates: generateRates(1500, 2800, 0.10),
    },
    {
      name: "Sunset Beach Resort",
      location: "ภูเก็ต",
      starRating: 4,
      rates: generateRates(3000, 5500, 0.20),
    },
  ];
}

function generateRates(
  minPrice: number,
  maxPrice: number,
  weekendMarkup: number
) {
  const rates: MockCompetitor["rates"] = [];
  const roomTypes = ["Deluxe Room", "Superior Room", "Suite"];
  const otas = ["Agoda", "Booking.com"];

  for (let day = 0; day < 14; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (const roomType of roomTypes) {
      const basePrice =
        roomType === "Suite"
          ? maxPrice
          : roomType === "Deluxe Room"
            ? (minPrice + maxPrice) / 2
            : minPrice;

      for (const otaName of otas) {
        const variation = Math.round((Math.random() - 0.5) * 400);
        const otaDiff = otaName === "Booking.com" ? 100 : 0;
        const weekendAdj = isWeekend ? Math.round(basePrice * weekendMarkup) : 0;
        const price = basePrice + variation + otaDiff + weekendAdj;

        rates.push({
          roomType,
          otaName,
          dateOffset: day,
          price: Math.max(minPrice, Math.round(price)),
        });
      }
    }
  }

  return rates;
}
