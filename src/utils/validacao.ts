export function isValidDiscordId(id: string): boolean {
  return /^\d{17,20}$/.test(id);
}

export function isValidCron(expr: string): boolean {
  const trimmed = expr.trim();
  const safePattern = /^([0-5]?\d)\s+([01]?\d|2[0-3])\s+\*\s+\*\s+([0-6])$/;
  return safePattern.test(trimmed);
}

export function isOrientacaoChannelName(
  name: string,
  prefixes: string[] = ["phd", "msc", "bsc"],
): boolean {
  if (prefixes.length === 0) return false;
  const pattern = new RegExp(`^(${prefixes.join("|")})-[a-z0-9-]+$`);
  return pattern.test(name);
}

export function nivelFromChannelName(
  name: string,
  prefixes: string[] = ["phd", "msc", "bsc"],
): string | null {
  for (const prefix of prefixes) {
    if (name.startsWith(`${prefix}-`)) return prefix;
  }
  return null;
}

export function sanitizeDisplayName(name: string): string {
  return name.replace(/[*_~`|>@#\\]/g, "").slice(0, 80);
}

export function parseListaNomesCanais(lista: string): string[] {
  return lista
    .split(",")
    .map((s) => s.trim())
    .map((s) => s.replace(/^#/, ""))
    .filter((s) => s.length > 0 && /^[a-z0-9-]+$/.test(s));
}

export function displayNameFromChannel(
  channelName: string,
  prefixes: string[] = ["phd", "msc", "bsc"],
): string {
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const prefixPattern = prefixes.length > 0
    ? new RegExp(`^(${prefixes.map(escapeRegex).join("|")})-`)
    : /^[a-z]+-/;
  const parts = channelName.replace(prefixPattern, "").split("-");
  const pretty = parts
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return sanitizeDisplayName(pretty) || sanitizeDisplayName(channelName);
}
