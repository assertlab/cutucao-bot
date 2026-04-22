import { NonThreadGuildBasedChannel } from "discord.js";
import { config } from "../config";
import { isCanalOrientacao } from "../utils/canais";
import { log, maskChannelName } from "../utils/log";

export async function onChannelCreate(
  channel: NonThreadGuildBasedChannel,
): Promise<void> {
  if (channel.guild.id !== config.guildId) return;
  if (!isCanalOrientacao(channel)) return;
  log.info(
    `Novo canal de orientação detectado: ${maskChannelName(channel.name)}. Monitoramento automático ativado.`,
  );
}
