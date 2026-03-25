// src/engine/filters/pool-quality.filter.ts

export interface PoolHealthSummary {
  address: string;
  name?: string;
  status: "healthy" | "suspicious" | "unsupported";
  reasons: string[];
}

export function buildPoolHealthSummaries(results: any[]): PoolHealthSummary[] {
  const summaries = new Map<string, PoolHealthSummary>();

  for (const result of results) {
    const legs = Array.isArray(result?.legs) ? result.legs : [];

    for (const leg of legs) {
      const address = String(leg?.poolAddress ?? "");
      const name = leg?.pool ? String(leg.pool) : undefined;

      if (!address) continue;

      if (!summaries.has(address)) {
        summaries.set(address, {
          address,
          name,
          status: "healthy",
          reasons: [],
        });
      }
    }

    if (!legs.length) continue;

    const affectedAddresses = legs
      .map((leg: any) => String(leg?.poolAddress ?? ""))
      .filter(Boolean);

    if (result?.error) {
      for (const address of affectedAddresses) {
        const current = summaries.get(address);
        if (!current) continue;

        current.status = "unsupported";
        if (!current.reasons.includes("simulation_error")) {
          current.reasons.push("simulation_error");
        }
      }

      continue;
    }

    const pnlPct = typeof result?.pnlPct === "number" ? result.pnlPct : null;

    if (pnlPct !== null && pnlPct < -0.5) {
      for (const address of affectedAddresses) {
        const current = summaries.get(address);
        if (!current) continue;

        if (current.status !== "unsupported") {
          current.status = "suspicious";
        }

        if (!current.reasons.includes("catastrophic_loss")) {
          current.reasons.push("catastrophic_loss");
        }
      }
    }
  }

  return Array.from(summaries.values());
}