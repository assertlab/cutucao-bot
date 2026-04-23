import { Client, MessageFlags, SlashCommandBuilder } from "discord.js";
import { jobLembrete } from "../jobs/lembrete";
import { log, maskId } from "../utils/log";
import { SlashCommand } from "./types";

export const testeLembreteCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("teste-lembrete")
    .setDescription(
      "🐕 (Debug) Dispara manualmente o job de lembrete de check-in agora.",
    ),
  orientadorOnly: true,
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    log.info(
      `Comando /teste-lembrete disparado pelo orientador (${maskId(interaction.user.id)}).`,
    );
    try {
      await jobLembrete(interaction.client as Client<true>);
      await interaction.editReply(
        "🐕 Au au! Lembretes disparados manualmente. Confira os canais de orientação.",
      );
    } catch (err) {
      log.error("Falha ao executar /teste-lembrete.", err);
      await interaction.editReply(
        "🐕 Algo deu errado ao disparar os lembretes. Confira os logs.",
      );
    }
  },
};
