import { CategoryChannel, ChannelType, Guild, MessageFlags, SlashCommandBuilder } from "discord.js";
import { appConfig, labelDoNivel } from "../config/appConfig";
import { mensagens } from "../mensagens";
import { isCanalOrientacao } from "../utils/canais";
import { nivelFromChannelName } from "../utils/validacao";
import { SlashCommand } from "./types";

function encontrarCategoria(guild: Guild, nomeCategoria: string): CategoryChannel | undefined {
  for (const canal of guild.channels.cache.values()) {
    if (canal.type === ChannelType.GuildCategory && canal.name.toLowerCase() === nomeCategoria.toLowerCase()) {
      return canal;
    }
  }
  return undefined;
}

export function montarConteudoCanais(guild: Guild): string {
  const prefixes = Object.keys(appConfig.prefixos);
  let total = 0;
  const blocosCategorias: string[] = [];

  for (const nomeCategoria of appConfig.categorias) {
    const categoria = encontrarCategoria(guild, nomeCategoria);
    if (!categoria) continue;

    const canaisPorNivel = new Map<string, string[]>();
    for (const canal of guild.channels.cache.values()) {
      if (canal.parentId !== categoria.id) continue;
      if (!isCanalOrientacao(canal)) continue;
      const nivel = nivelFromChannelName(canal.name, prefixes);
      if (!nivel) continue;
      const lista = canaisPorNivel.get(nivel) ?? [];
      lista.push(canal.name);
      canaisPorNivel.set(nivel, lista);
    }

    const blocosNiveis: string[] = [];
    for (const nivel of prefixes) {
      const nomes = canaisPorNivel.get(nivel);
      if (!nomes || nomes.length === 0) continue;
      nomes.sort((a, b) => a.localeCompare(b));
      total += nomes.length;
      const linhas = nomes.map((nome) => `- #${nome}`).join("\n");
      blocosNiveis.push(`**${labelDoNivel(nivel)} (${nomes.length}):**\n${linhas}`);
    }
    if (blocosNiveis.length === 0) continue;

    blocosCategorias.push(`📁 **${categoria.name}**\n\n${blocosNiveis.join("\n\n")}`);
  }

  if (total === 0) {
    return mensagens.get("cmd_canais_sem_canais");
  }

  return mensagens.get("cmd_canais_conteudo", {
    total: String(total),
    corpo: blocosCategorias.join("\n\n"),
  });
}

export const canaisCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("canais")
    .setDescription("🐕 Lista todos os canais monitorados, agrupados por categoria e nível."),
  orientadorOnly: true,
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: mensagens.get("cmd_erro_guild_only"),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content: montarConteudoCanais(interaction.guild),
      flags: MessageFlags.Ephemeral,
    });
  },
};
