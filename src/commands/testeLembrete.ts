import { Client, MessageFlags, SlashCommandBuilder } from "discord.js";
import { jobLembrete } from "../jobs/lembrete";
import { mensagens } from "../mensagens";
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
      await interaction.editReply(mensagens.get("cmd_teste_lembrete_sucesso"));
    } catch (err) {
      log.error("Falha ao executar /teste-lembrete.", err);
      await interaction.editReply(mensagens.get("cmd_teste_lembrete_erro"));
    }
  },
};
