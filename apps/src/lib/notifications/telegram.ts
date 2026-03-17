import { logger } from "@/lib/logger";
import { withRetry } from "@/utils/retry";

function getApiUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  return withRetry(
    async () => {
      const res = await fetch(getApiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Telegram API error ${res.status}: ${err}`);
      }

      logger.info("Telegram message sent", {
        action: "telegram_send",
        chatId,
      });
    },
    { context: "telegram.sendMessage", maxRetries: 2 }
  );
}

export async function sendTelegramWithButtons(
  chatId: string,
  text: string,
  buttons: { text: string; url: string }[]
) {
  return withRetry(
    async () => {
      const res = await fetch(getApiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              buttons.map((b) => ({
                text: b.text,
                url: b.url,
              })),
            ],
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Telegram API error ${res.status}: ${err}`);
      }

      logger.info("Telegram message with buttons sent", {
        action: "telegram_send_buttons",
        chatId,
      });
    },
    { context: "telegram.sendWithButtons", maxRetries: 2 }
  );
}
