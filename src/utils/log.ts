function truncate(value: string, keep = 3): string {
  if (value.length <= keep) return "***";
  return `${value.slice(0, keep)}***`;
}

export function maskChannelName(name: string): string {
  const match = /^(phd|msc|bsc)-(.+)$/.exec(name);
  if (!match) return truncate(name);
  return `${match[1]}-${truncate(match[2] ?? "")}`;
}

export function maskId(id: string): string {
  return truncate(id, 4);
}

function timestamp(): string {
  return new Date().toISOString();
}

export const log = {
  info(message: string, extra?: Record<string, unknown>): void {
    console.log(`[${timestamp()}] 🐕 ${message}`, extra ?? "");
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    console.warn(`[${timestamp()}] ⚠️  ${message}`, extra ?? "");
  },
  error(message: string, err?: unknown): void {
    const detail = err instanceof Error ? err.message : err;
    console.error(`[${timestamp()}] ❌ ${message}`, detail ?? "");
  },
};
