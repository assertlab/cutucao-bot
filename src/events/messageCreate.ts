import { Message } from "discord.js";
import { config } from "../config";
import { registrarCheckin } from "../database";
import { isCanalOrientacao } from "../utils/canais";
import { log, maskChannelName } from "../utils/log";
import { currentIsoWeek } from "../utils/semana";
import { nivelFromChannelName } from "../utils/validacao";

export async function onMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (message.system) return;
  if (!message.guild) return;
  if (message.guild.id !== config.guildId) return;
  if (!message.channel.isTextBased()) return;

  const canal = message.channel;
  if (!("guild" in canal)) return;
  if (!isCanalOrientacao(canal)) return;

  const nivel = nivelFromChannelName(canal.name);
  if (!nivel) return;

  const semana = currentIsoWeek(config.timezone, message.createdAt);

  try {
    const { novo } = registrarCheckin({
      canalId: canal.id,
      nomeCanal: canal.name,
      nivel,
      semana,
      dataCheckin: message.createdAt,
    });
    if (novo) {
      log.info(`Check-in registrado em ${maskChannelName(canal.name)} (semana ${semana}).`);
    }
  } catch (err) {
    log.error("Falha ao registrar check-in.", err);
  }
}
