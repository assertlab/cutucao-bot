import { formatWeekRange } from "./semana";
import { displayNameFromChannel } from "./validacao";

export function mensagemLembrete(dataFormatada: string, alunoId: string | null): string {
  const saudacao = alunoId ? `<@${alunoId}> ` : "";
  return (
    `🐕 **Au au! Check-in Semanal — ${dataFormatada}**\n\n` +
    `${saudacao}Hora de atualizar seu progresso! Use o template abaixo:\n\n` +
    `**O que fiz desde o último check-in:**\n-\n\n` +
    `**O que pretendo fazer esta semana:**\n-\n\n` +
    `**Onde estou travado (se aplicável):**\n-\n\n` +
    `**Próximo marco/entrega:**\n-`
  );
}

export function mensagemCobranca(): string {
  return (
    `🐕 Oi, sumido(a)! Seu check-in desta semana ainda não apareceu. Tá tudo bem por aí?\n` +
    `Se precisar de ajuda com algo, é só latir por aqui!`
  );
}

export function mensagemBoasVindas(nomeSanitizado: string): string {
  return (
    `🐕 Bem-vindo(a) à matilha do ASSERT Lab, **${nomeSanitizado}**!\n\n` +
    `Leia as regras fixadas neste canal para entender como o servidor funciona.\n` +
    `Se você é orientando(a), seu canal individual está na categoria **Orientações**.\n\n` +
    `Dúvidas? É só perguntar no #café!`
  );
}

export interface LinhaResumo {
  nomeCanal: string;
  nivel: "phd" | "msc" | "bsc";
  semanasSemCheckin: number;
}

export function mensagemResumoSemanal(
  isoWeek: string,
  postaram: LinhaResumo[],
  naoPostaram: LinhaResumo[],
): string {
  const total = postaram.length + naoPostaram.length;
  const taxa = total === 0 ? 0 : Math.round((postaram.length / total) * 100);
  const { inicio, fim } = formatWeekRange(isoWeek);

  const formataLinha = (linha: LinhaResumo, mostraSemanas = false): string => {
    const nome = displayNameFromChannel(linha.nomeCanal);
    const base = `- ${nome} (${linha.nivel})`;
    if (!mostraSemanas) return base;
    const alerta = linha.semanasSemCheckin >= 3 ? "⚠️ " : "";
    const plural = linha.semanasSemCheckin === 1 ? "semana" : "semanas";
    return `${base} — ${alerta}${linha.semanasSemCheckin} ${plural} sem check-in`;
  };

  const secaoPostaram = postaram.length
    ? postaram.map((l) => formataLinha(l)).join("\n")
    : "- (ninguém ainda 🐕)";

  const secaoNaoPostaram = naoPostaram.length
    ? naoPostaram.map((l) => formataLinha(l, true)).join("\n")
    : "- (todos em dia! 🎉)";

  return (
    `🐕 **Relatório da matilha — ASSERT Lab**\n` +
    `Semana de ${inicio} a ${fim}\n\n` +
    `✅ Postaram check-in (${postaram.length}/${total}):\n${secaoPostaram}\n\n` +
    `❌ Não postaram (${naoPostaram.length}/${total}):\n${secaoNaoPostaram}\n\n` +
    `📈 Taxa de adesão: ${taxa}%`
  );
}

export function templateCheckin(): string {
  return (
    `**O que fiz desde o último check-in:**\n-\n\n` +
    `**O que pretendo fazer esta semana:**\n-\n\n` +
    `**Onde estou travado (se aplicável):**\n-\n\n` +
    `**Próximo marco/entrega:**\n-`
  );
}

export function mensagemAlertaInativos(inativos: LinhaResumo[]): string {
  const linhas = inativos
    .map((l) => {
      const nome = displayNameFromChannel(l.nomeCanal);
      return `- ${nome} (${l.nivel}) — ${l.semanasSemCheckin} semanas sem check-in`;
    })
    .join("\n");
  return (
    `🐕 Aviso da matilha: há orientandos inativos há 2+ semanas.\n\n` +
    `${linhas}\n\n` +
    `Talvez valha uma conversa pra entender o que tá rolando.`
  );
}
