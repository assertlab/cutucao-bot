import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "./types";

export const ajudaCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ajuda")
    .setDescription("🐕 Lista todos os comandos disponíveis."),
  orientadorOnly: false,
  async execute(interaction) {
    const conteudo =
      `🐕 **Comandos do cutuCÃO**\n\n` +
      `**Para todos:**\n` +
      `\`/template\` — Exibe o template de check-in para copiar e colar\n` +
      `\`/ajuda\` — Exibe esta lista de comandos\n\n` +
      `**Só pro orientador:**\n` +
      `\`/status\` — Mostra quem postou e quem não postou o check-in esta semana\n` +
      `\`/resumo #canal\` — Histórico de check-ins de um canal nas últimas 4 semanas\n` +
      `\`/teste-lembrete\` — Dispara manualmente o job de lembrete de check-in`;

    await interaction.reply({
      content: conteudo,
      flags: MessageFlags.Ephemeral,
    });
  },
};
