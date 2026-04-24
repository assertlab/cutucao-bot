import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `🐕 Variável de ambiente obrigatória ausente: ${name}. Veja .env.example.`,
    );
  }
  return value.trim();
}

function isValidDiscordId(id: string): boolean {
  return /^\d{17,20}$/.test(id);
}

const discordToken = required("DISCORD_TOKEN");
const guildId = required("GUILD_ID");
const orientadorId = required("ORIENTADOR_ID");

if (!isValidDiscordId(guildId)) {
  throw new Error("🐕 GUILD_ID inválido — esperado snowflake Discord (17-20 dígitos).");
}
if (!isValidDiscordId(orientadorId)) {
  throw new Error("🐕 ORIENTADOR_ID inválido — esperado snowflake Discord (17-20 dígitos).");
}

export const config = {
  discordToken,
  guildId,
  orientadorId,
  databasePath: process.env.DATABASE_PATH?.trim() || "./data/cutucao.db",
  timezone: process.env.TZ?.trim() || "America/Recife",
  limites: {
    mensagensPorCiclo: 20,
    dmsPorCiclo: 5,
    cooldownMs: 1000,
  },
} as const;
