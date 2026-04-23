import { ChannelType, GuildMember, TextChannel } from "discord.js";
import { config } from "../config";
import { mensagemBoasVindas } from "../utils/formatters";
import { log } from "../utils/log";
import { sanitizeDisplayName } from "../utils/validacao";

export async function onGuildMemberAdd(member: GuildMember): Promise<void> {
  if (member.guild.id !== config.guildId) return;

  const canal = member.guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === config.canalBoasVindas,
  ) as TextChannel | undefined;

  if (!canal) {
    log.warn(`Canal de boas-vindas "${config.canalBoasVindas}" não encontrado.`);
    return;
  }

  const nome = sanitizeDisplayName(member.displayName);
  try {
    await canal.send({
      content: mensagemBoasVindas(nome),
      allowedMentions: { parse: [] },
    });
    log.info(`Boas-vindas enviadas para ${member.user.tag}.`);
  } catch (err) {
    log.error("Falha ao enviar mensagem de boas-vindas.", err);
  }
}
