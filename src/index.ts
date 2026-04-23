import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config";
import { closeDatabase } from "./database";
import { onChannelCreate } from "./events/channelCreate";
import { onInteractionCreate } from "./events/interactionCreate";
import { onMessageCreate } from "./events/messageCreate";
import { onReady } from "./events/ready";
import { iniciarAgendador, pararAgendador } from "./jobs/scheduler";
import { log } from "./utils/log";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
  allowedMentions: { parse: [] },
});

client.once(Events.ClientReady, async (readyClient) => {
  try {
    await onReady(readyClient);
    iniciarAgendador(readyClient);
  } catch (err) {
    log.error("Falha durante inicialização.", err);
  }
});

client.on(Events.MessageCreate, (message) => {
  void onMessageCreate(message);
});

client.on(Events.ChannelCreate, (channel) => {
  void onChannelCreate(channel);
});

client.on(Events.InteractionCreate, (interaction) => {
  void onInteractionCreate(interaction);
});

client.on(Events.GuildCreate, async (guild) => {
  if (guild.id === config.guildId) return;
  log.warn("Bot adicionado a guild não autorizada. Saindo.", { guildId: guild.id });
  try {
    await guild.leave();
  } catch (err) {
    log.error("Falha ao sair de guild não autorizada.", err);
  }
});

client.on(Events.Error, (err) => {
  log.error("Erro do cliente Discord.", err);
});

client.on(Events.Warn, (message) => {
  log.warn(`Aviso do cliente Discord: ${message}`);
});

async function shutdown(signal: string): Promise<void> {
  log.info(`Recebido ${signal}. Desligando...`);
  pararAgendador();
  try {
    await client.destroy();
  } catch (err) {
    log.error("Falha ao destruir cliente Discord.", err);
  }
  try {
    closeDatabase();
  } catch (err) {
    log.error("Falha ao fechar banco de dados.", err);
  }
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
  log.error("Unhandled rejection.", err);
});
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception.", err);
});

client.login(config.discordToken).catch((err) => {
  log.error("Falha no login. Verifique DISCORD_TOKEN.", err);
  process.exit(1);
});
