import { Interaction, MessageFlags } from "discord.js";
import { commands } from "../commands";
import { onLimparButton } from "../commands/limpar";
import { config } from "../config";
import { mensagens } from "../mensagens";
import { log, maskId } from "../utils/log";
import { exigirOrientador } from "../utils/permissoes";

export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  if (interaction.guildId !== config.guildId) return;

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("limpar:")) {
      try {
        await onLimparButton(interaction);
      } catch (err) {
        log.error("Falha ao processar botão de /limpar.", err);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

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
          content: mensagens.get("cmd_erro_generico"),
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: mensagens.get("cmd_erro_generico"),
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyErr) {
      log.error("Falha ao enviar resposta de erro do comando.", replyErr);
    }
  }
}
