export function isValidDiscordId(id: string): boolean {
  return /^\d{17,20}$/.test(id);
}

export function isValidCron(expr: string): boolean {
  const trimmed = expr.trim();
  const safePattern = /^([0-5]?\d)\s+([01]?\d|2[0-3])\s+\*\s+\*\s+([0-6])$/;
  return safePattern.test(trimmed);
}

export function isOrientacaoChannelName(name: string): boolean {
  return /^(phd|msc|bsc)-[a-z0-9-]+$/.test(name);
}

export function nivelFromChannelName(name: string): "phd" | "msc" | "bsc" | null {
  const match = /^(phd|msc|bsc)-/.exec(name);
  if (!match) return null;
  return match[1] as "phd" | "msc" | "bsc";
}

export function sanitizeDisplayName(name: string): string {
  return name.replace(/[*_~`|>@#\\]/g, "").slice(0, 80);
}

export function displayNameFromChannel(channelName: string): string {
  const parts = channelName.replace(/^(phd|msc|bsc)-/, "").split("-");
  const pretty = parts
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return sanitizeDisplayName(pretty) || sanitizeDisplayName(channelName);
}
