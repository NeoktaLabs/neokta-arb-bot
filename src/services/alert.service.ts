// src/services/alert.service.ts

import { getEnv } from "../config/env";
import type { Env } from "../domain/types";
import { logError, logInfo } from "../lib/logger";

export interface TelegramAlertMessage {
  category: "profit" | "near_miss" | "imbalance";
  title: string;
  body: string;
  score: number;
}

interface SendTelegramMessageArgs {
  botToken: string;
  chatId: string;
  text: string;
}

async function sendTelegramMessage(args: SendTelegramMessageArgs): Promise<boolean> {
  const response = await fetch(`https://api.telegram.org/bot${args.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: args.chatId,
      text: args.text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logError("Telegram send failed", {
      status: response.status,
      body,
    });
    return false;
  }

  return true;
}

function buildTelegramText(message: TelegramAlertMessage): string {
  return [message.title, "", message.body].join("\n");
}

export async function sendTelegramAlerts(
  env: Env,
  messages: TelegramAlertMessage[]
): Promise<{
  enabled: boolean;
  attempted: number;
  sent: number;
}> {
  const config = getEnv(env);

  if (!config.enableTelegramAlerts) {
    logInfo("Telegram alerts disabled by config", {
      attempted: messages.length,
    });

    return {
      enabled: false,
      attempted: 0,
      sent: 0,
    };
  }

  if (!config.telegramBotToken || !config.telegramChatId) {
    logError("Telegram alerts enabled but credentials missing", {
      hasBotToken: Boolean(config.telegramBotToken),
      hasChatId: Boolean(config.telegramChatId),
    });

    return {
      enabled: true,
      attempted: 0,
      sent: 0,
    };
  }

  let sent = 0;

  for (const message of messages) {
    const ok = await sendTelegramMessage({
      botToken: config.telegramBotToken,
      chatId: config.telegramChatId,
      text: buildTelegramText(message),
    });

    if (ok) {
      sent += 1;
    }
  }

  logInfo("Telegram alert batch complete", {
    attempted: messages.length,
    sent,
  });

  return {
    enabled: true,
    attempted: messages.length,
    sent,
  };
}