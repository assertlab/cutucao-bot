import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { mensagens } from "../mensagens";
import { SlashCommand } from "./types";

export const ajudaCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ajuda")
    .setDescription("🐕 Lista todos os comandos disponíveis."),
  orientadorOnly: false,
  async execute(interaction) {
    await interaction.reply({
      content: mensagens.get("cmd_ajuda"),
      flags: MessageFlags.Ephemeral,
    });
  },
};
