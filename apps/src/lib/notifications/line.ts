import { logger } from "@/lib/logger";
import { withRetry } from "@/utils/retry";

const LINE_API = "https://api.line.me/v2/bot";

function getHeaders() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return null;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function isDemoMode() {
  return !process.env.LINE_CHANNEL_ACCESS_TOKEN;
}

export async function sendLineMessage(userId: string, message: string) {
  if (isDemoMode()) {
    logger.info("[DEMO] LINE message skipped", { userId, message: message.substring(0, 50) });
    return;
  }
  return withRetry(
    async () => {
      const res = await fetch(`${LINE_API}/message/push`, {
        method: "POST",
        headers: getHeaders()!,
        body: JSON.stringify({
          to: userId,
          messages: [{ type: "text", text: message }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LINE API error ${res.status}: ${err}`);
      }

      logger.info("LINE message sent", {
        action: "line_send",
        userId,
      });
    },
    { context: "line.pushMessage", maxRetries: 2 }
  );
}

export async function sendLineFlexMessage(
  userId: string,
  altText: string,
  contents: Record<string, unknown>
) {
  if (isDemoMode()) {
    logger.info("[DEMO] LINE flex message skipped", { userId, altText });
    return;
  }
  return withRetry(
    async () => {
      const res = await fetch(`${LINE_API}/message/push`, {
        method: "POST",
        headers: getHeaders()!,
        body: JSON.stringify({
          to: userId,
          messages: [
            {
              type: "flex",
              altText,
              contents,
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LINE API error ${res.status}: ${err}`);
      }

      logger.info("LINE flex message sent", {
        action: "line_flex_send",
        userId,
      });
    },
    { context: "line.pushFlexMessage", maxRetries: 2 }
  );
}

export function buildRecommendationFlex(
  count: number,
  hotelName: string,
  approveUrl: string
): Record<string, unknown> {
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "RateGenie",
          weight: "bold",
          color: "#2563EB",
          size: "sm",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `คำแนะนำราคาใหม่ ${count} รายการ`,
          weight: "bold",
          size: "lg",
        },
        {
          type: "text",
          text: hotelName,
          size: "sm",
          color: "#666666",
          margin: "md",
        },
        {
          type: "text",
          text: "กดปุ่มด้านล่างเพื่อดูรายละเอียดและอนุมัติ",
          size: "sm",
          color: "#999999",
          margin: "md",
          wrap: true,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "uri",
            label: "ดูคำแนะนำ",
            uri: approveUrl,
          },
          color: "#2563EB",
        },
      ],
    },
  };
}
