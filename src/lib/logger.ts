// src/lib/logger.ts

export function logInfo(message: string, data?: unknown) {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      data,
      timestamp: new Date().toISOString(),
      service: "neokta-arb-bot",
    })
  );
}

export function logError(message: string, data?: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      data,
      timestamp: new Date().toISOString(),
      service: "neokta-arb-bot",
    })
  );
}