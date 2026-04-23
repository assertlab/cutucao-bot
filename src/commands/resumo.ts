import { ChannelType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { listarHistoricoCanal } from "../database";
import { config } from "../config";
import { isCanalOrientacao } from "../utils/canais";
import { currentIsoWeek, formatWeekRange, isoWeekOffset } from "../utils/semana";
import { displayNameFromChannel } from "../utils/validacao";
import { SlashCommand } from "./types";

const SEMANAS = 4;

export const resumoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("resumo")
    .setDescription("🐕 Mostra o histórico de check-ins de um canal nas últimas 4 semanas.")
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
        content: "🐕 Este comando só funciona em um servidor.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const canal = interaction.guild.channels.cache.get(canalOpt.id);
    if (!canal || !isCanalOrientacao(canal)) {
      await interaction.reply({
        content: "🐕 O canal selecionado não é um canal de orientação válido.\nEscolha um canal da categoria **Orientações** com prefixo `phd-`, `msc-` ou `bsc-`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const semanaAtual = currentIsoWeek(config.timezone);
    const semanas: string[] = [];
    for (let i = 0; i < SEMANAS; i++) {
      semanas.push(isoWeekOffset(semanaAtual, -i));
    }

    const historico = listarHistoricoCanal(canal.id);
    const porSemana = new Map(historico.map((r) => [r.semana, r.checkinRealizado]));

    const nomeLegivel = displayNameFromChannel(canal.name);
    const linhas = semanas.map((semana) => {
      const { inicio, fim } = formatWeekRange(semana);
      const flag = porSemana.get(semana);
      const icone = flag === 1 ? "✅" : flag === 0 ? "❌" : "—";
      const label = flag === undefined ? "sem dados" : flag === 1 ? "check-in realizado" : "não postou";
      return `${icone} **${inicio}–${fim}** — ${label}`;
    });

    const conteudo =
      `🐕 **Histórico de check-ins — ${nomeLegivel}**\n` +
      `Canal: <#${canal.id}>\n\n` +
      linhas.join("\n");

    await interaction.reply({
      content: conteudo,
      flags: MessageFlags.Ephemeral,
    });
  },
};
