import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { config } from "../config";
import { mensagens } from "../mensagens";

export async function exigirOrientador(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (interaction.user.id === config.orientadorId) return true;
  await interaction.reply({
    content: mensagens.get("cmd_permissao_negada"),
    flags: MessageFlags.Ephemeral,
  });
  return false;
}
