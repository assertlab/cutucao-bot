import { ChannelType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { appConfig } from "../config/appConfig";
import { config } from "../config";
import { mensagens } from "../mensagens";
import { checkinRepo } from "../repositories";
import { isCanalOrientacao } from "../utils/canais";
import { currentIsoWeek, formatWeekRange, isoWeekOffset } from "../utils/semana";
import { displayNameFromChannel } from "../utils/validacao";
import { SlashCommand } from "./types";

export const resumoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("resumo")
    .setDescription("🐕 Mostra o histórico de check-ins de um canal nas últimas semanas.")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal de orientação para consultar")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText),
    ),
  orientadorOnly: true,
  async execute(interaction) {
    const canalOpt = interaction.options.getChannel("canal", true);

    if (!interaction.guild) {
      await interaction.reply({
        content: mensagens.get("cmd_erro_guild_only"),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const canal = interaction.guild.channels.cache.get(canalOpt.id);
    if (!canal || !isCanalOrientacao(canal)) {
      await interaction.reply({
        content: mensagens.get("cmd_erro_canal_invalido"),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const semanas_n = appConfig.visualizacao.semanas_historico_padrao;
    const semanaAtual = currentIsoWeek(config.timezone);
    const semanas: string[] = [];
    for (let i = 0; i < semanas_n; i++) {
      semanas.push(isoWeekOffset(semanaAtual, -i));
    }

    const historico = checkinRepo.listarHistoricoCanal(canal.id);
    const porSemana = new Map(historico.map((r) => [r.semana, r.checkinRealizado]));

    const nomeLegivel = displayNameFromChannel(canal.name, Object.keys(appConfig.prefixos));
    const linhas = semanas.map((semana) => {
      const { inicio, fim } = formatWeekRange(semana);
      const flag = porSemana.get(semana);
      const icone = flag === 1 ? "✅" : flag === 0 ? "❌" : "—";
      const label =
        flag === undefined ? "sem dados" : flag === 1 ? "check-in realizado" : "não postou";
      return `${icone} **${inicio}–${fim}** — ${label}`;
    });

    await interaction.reply({
      content: mensagens.get("cmd_resumo_historico", {
        nome: nomeLegivel,
        canal_id: canal.id,
        linhas: linhas.join("\n"),
      }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
