import { statSync } from "node:fs";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { config } from "../config";
import { appConfig, labelDoNivel } from "../config/appConfig";
import { mensagens } from "../mensagens";
import { checkinRepo } from "../repositories";
import { formatBytes } from "../utils/formatBytes";
import { formatDateBr, isoWeekMonday } from "../utils/semana";
import { SlashCommand } from "./types";

function tamanhoBanco(): string {
  try {
    const stats = statSync(config.databasePath);
    return formatBytes(stats.size);
  } catch {
    return "—";
  }
}

function semanaParaData(isoWeek: string | null): string {
  if (!isoWeek) return "—";
  try {
    return formatDateBr(isoWeekMonday(isoWeek), config.timezone);
  } catch {
    return "—";
  }
}

export const usoCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("uso")
    .setDescription(
      "🐕 Mostra estatísticas de uso do banco de dados (registros, canais, tamanho).",
    ),
  orientadorOnly: true,
  async execute(interaction) {
    const total = checkinRepo.contarRegistros();
    const tamanho = tamanhoBanco();

    if (total === 0) {
      await interaction.reply({
        content: mensagens.get("cmd_uso_sem_dados", { tamanho }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const totalCanais = checkinRepo.contarCanaisMonitorados();
    const maisAntigo = semanaParaData(checkinRepo.registroMaisAntigo());
    const maisRecente = semanaParaData(checkinRepo.registroMaisRecente());
    const porNivel = checkinRepo.contarRegistrosPorNivel();

    const linhasNivel = porNivel.length
      ? porNivel
          .map((r) => `- ${labelDoNivel(r.nivel)}: ${r.total} registro(s)`)
          .join("\n")
      : `- ${Object.values(appConfig.prefixos).join(", ")}: 0 registros`;

    await interaction.reply({
      content: mensagens.get("cmd_uso_conteudo", {
        total_registros: String(total),
        total_canais: String(totalCanais),
        mais_antigo: maisAntigo,
        mais_recente: maisRecente,
        tamanho,
        linhas_nivel: linhasNivel,
      }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
