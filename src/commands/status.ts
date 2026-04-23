import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { listarStatusSemana } from "../database";
import { config } from "../config";
import { currentIsoWeek, formatWeekRange } from "../utils/semana";
import { displayNameFromChannel } from "../utils/validacao";
import { SlashCommand } from "./types";

export const statusCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("🐕 Mostra quem postou e quem não postou o check-in esta semana."),
  orientadorOnly: true,
  async execute(interaction) {
    const semana = currentIsoWeek(config.timezone);
    const registros = listarStatusSemana(semana);
    const { inicio, fim } = formatWeekRange(semana);

    if (registros.length === 0) {
      await interaction.reply({
        content: `🐕 Nenhum canal monitorado encontrado para a semana de ${inicio} a ${fim}.\nOs lembretes de segunda-feira populam os registros automaticamente.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const postaram = registros.filter((r) => r.checkinRealizado === 1);
    const naoPostaram = registros.filter((r) => r.checkinRealizado === 0);
    const total = registros.length;
    const taxa = Math.round((postaram.length / total) * 100);

    const fmt = (r: (typeof registros)[0]) =>
      `- ${displayNameFromChannel(r.nomeCanal)} (${r.nivel})`;

    const linhasPostaram = postaram.length
      ? postaram.map(fmt).join("\n")
      : "- (nenhum ainda)";

    const linhasNao = naoPostaram.length
      ? naoPostaram.map(fmt).join("\n")
      : "- (todos em dia! 🎉)";

    const conteudo =
      `🐕 **Status de check-in — Semana de ${inicio} a ${fim}**\n\n` +
      `✅ Postaram (${postaram.length}/${total}):\n${linhasPostaram}\n\n` +
      `❌ Não postaram (${naoPostaram.length}/${total}):\n${linhasNao}\n\n` +
      `📈 Taxa de adesão: ${taxa}%`;

    await interaction.reply({
      content: conteudo,
      flags: MessageFlags.Ephemeral,
    });
  },
};
