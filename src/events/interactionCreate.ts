import { Interaction, MessageFlags } from "discord.js";
import { commands } from "../commands";
import { config } from "../config";
import { log, maskId } from "../utils/log";
import { exigirOrientador } from "../utils/permissoes";

export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.guildId !== config.guildId) return;

  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;

  if (cmd.orientadorOnly && !(await exigirOrientador(interaction))) {
    log.warn(
      `Acesso negado a /${interaction.commandName} (user ${maskId(interaction.user.id)}).`,
    );
    return;
  }

  try {
    await cmd.execute(interaction);
  } catch (err) {
    log.error(`Falha no comando /${interaction.commandName}.`, err);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "🐕 Algo deu errado ao executar o comando.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "🐕 Algo deu errado ao executar o comando.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyErr) {
      log.error("Falha ao enviar resposta de erro do comando.", replyErr);
    }
  }
}
