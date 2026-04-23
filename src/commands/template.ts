import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { templateCheckin } from "../utils/formatters";
import { SlashCommand } from "./types";

export const templateCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("template")
    .setDescription("🐕 Exibe o template de check-in para copiar e colar."),
  orientadorOnly: false,
  async execute(interaction) {
    await interaction.reply({
      content: templateCheckin(),
      flags: MessageFlags.Ephemeral,
    });
  },
};
