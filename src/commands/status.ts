import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { config } from "../config";
import { mensagens } from "../mensagens";
import { checkinRepo } from "../repositories";
import { mensagemStatus } from "../utils/formatters";
import { currentIsoWeek, formatWeekRange } from "../utils/semana";
import { SlashCommand } from "./types";

export const statusCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("🐕 Mostra quem postou e quem não postou o check-in esta semana."),
  orientadorOnly: true,
  async execute(interaction) {
    const semana = currentIsoWeek(config.timezone);
    const registros = checkinRepo.listarStatusSemana(semana);
    const { inicio, fim } = formatWeekRange(semana);

    if (registros.length === 0) {
      await interaction.reply({
        content: mensagens.get("cmd_status_sem_dados", { inicio, fim }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const postaram = registros.filter((r) => r.checkinRealizado === 1);
    const naoPostaram = registros.filter((r) => r.checkinRealizado === 0);

    await interaction.reply({
      content: mensagemStatus(semana, postaram, naoPostaram),
      flags: MessageFlags.Ephemeral,
    });
  },
};
