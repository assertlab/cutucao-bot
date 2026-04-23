import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { config } from "../config";

export async function exigirOrientador(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (interaction.user.id === config.orientadorId) return true;
  await interaction.reply({
    content: "🐕 Esse comando é só pro orientador!",
    flags: MessageFlags.Ephemeral,
  });
  return false;
}
