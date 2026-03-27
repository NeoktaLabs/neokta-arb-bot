// src/durable/scan-lock.do.ts

type LockRecord = {
  locked: boolean;
  ownerScanId: string | null;
  startedAt: number | null;
  expiresAt: number | null;
  ownerType: string | null;
  chainId: string | null;
};

type AcquireBody = {
  scanId: string;
  ttlMs?: number;
  ownerType?: string;
  chainId?: string;
};

const STORAGE_KEY = "scan-lock";
const DEFAULT_TTL_MS = 20 * 60 * 1000;

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export class ScanLockDurableObject {
  constructor(private readonly state: DurableObjectState) {}

  private async readLock(): Promise<LockRecord> {
    const stored = await this.state.storage.get<LockRecord>(STORAGE_KEY);
    return (
      stored ?? {
        locked: false,
        ownerScanId: null,
        startedAt: null,
        expiresAt: null,
        ownerType: null,
        chainId: null,
      }
    );
  }

  private async writeLock(lock: LockRecord): Promise<void> {
    await this.state.storage.put(STORAGE_KEY, lock);
  }

  private isExpired(lock: LockRecord, now: number): boolean {
    return Boolean(lock.locked && lock.expiresAt && lock.expiresAt <= now);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const now = Date.now();

    if (url.pathname === "/status" && request.method === "GET") {
      const lock = await this.readLock();
      return json({ ok: true, lock, expired: this.isExpired(lock, now) });
    }

    if (url.pathname === "/acquire" && request.method === "POST") {
      const body = (await request.json()) as AcquireBody;
      const ttlMs = Math.max(1_000, body.ttlMs ?? DEFAULT_TTL_MS);
      const current = await this.readLock();

      if (current.locked && !this.isExpired(current, now)) {
        return json(
          {
            ok: false,
            acquired: false,
            reason: "locked",
            lock: current,
          },
          { status: 409 }
        );
      }

      const next: LockRecord = {
        locked: true,
        ownerScanId: body.scanId,
        startedAt: now,
        expiresAt: now + ttlMs,
        ownerType: body.ownerType ?? null,
        chainId: body.chainId ?? null,
      };

      await this.writeLock(next);

      return json({ ok: true, acquired: true, lock: next });
    }

    if (url.pathname === "/release" && request.method === "POST") {
      const body = (await request.json()) as { scanId?: string; force?: boolean };
      const current = await this.readLock();

      if (!current.locked) {
        return json({ ok: true, released: true, alreadyUnlocked: true });
      }

      if (!body.force && body.scanId && current.ownerScanId && body.scanId !== current.ownerScanId) {
        return json(
          {
            ok: false,
            released: false,
            reason: "owner_mismatch",
            lock: current,
          },
          { status: 409 }
        );
      }

      const next: LockRecord = {
        locked: false,
        ownerScanId: null,
        startedAt: null,
        expiresAt: null,
        ownerType: null,
        chainId: null,
      };

      await this.writeLock(next);
      return json({ ok: true, released: true, lock: next });
    }

    return json({ ok: false, error: "Route not found" }, { status: 404 });
  }
}
