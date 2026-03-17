import { logger } from "@/lib/logger";
import { withRetry } from "@/utils/retry";

function isDemoMode() {
  return !process.env.TELEGRAM_BOT_TOKEN;
}

function getApiUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  if (isDemoMode()) {
    logger.info("[DEMO] Telegram message skipped", { chatId, text: text.substring(0, 50) });
    return;
  }
  return withRetry(
    async () => {
      const res = await fetch(getApiUrl("sendMessage")!, {
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
  if (isDemoMode()) {
    logger.info("[DEMO] Telegram buttons message skipped", { chatId, text: text.substring(0, 50) });
    return;
  }
  return withRetry(
    async () => {
      const res = await fetch(getApiUrl("sendMessage")!, {
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
