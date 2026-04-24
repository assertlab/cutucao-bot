import { appConfig, labelDoNivel } from "../config/appConfig";
import { mensagens } from "../mensagens";
import { formatWeekRange } from "./semana";
import { displayNameFromChannel } from "./validacao";

export interface LinhaResumo {
  nomeCanal: string;
  nivel: string;
  semanasSemCheckin: number;
}

export function mensagemLembrete(
  dataFormatada: string,
  alunoId: string | null,
): string {
  const saudacao = alunoId ? `<@${alunoId}> ` : "";
  return mensagens.get("lembrete_semanal", { data: dataFormatada, saudacao });
}

export function mensagemCobranca(): string {
  return mensagens.get("cobranca_gentil");
}

export function mensagemBoasVindas(nomeSanitizado: string): string {
  return mensagens.get("boas_vindas", { nome: nomeSanitizado });
}

export function templateCheckin(): string {
  return mensagens.get("template_checkin");
}

export function mensagemResumoSemanal(
  isoWeek: string,
  postaram: LinhaResumo[],
  naoPostaram: LinhaResumo[],
): string {
  const total = postaram.length + naoPostaram.length;
  const taxa = total === 0 ? 0 : Math.round((postaram.length / total) * 100);
  const { inicio, fim } = formatWeekRange(isoWeek);
  const prefixes = Object.keys(appConfig.prefixos);

  const formataLinha = (linha: LinhaResumo, mostraSemanas = false): string => {
    const nome = displayNameFromChannel(linha.nomeCanal, prefixes);
    const base = `- ${nome} (${labelDoNivel(linha.nivel)})`;
    if (!mostraSemanas) return base;
    const alerta = linha.semanasSemCheckin >= appConfig.escalacao.semanas_para_alerta ? "⚠️ " : "";
    const plural = linha.semanasSemCheckin === 1 ? "semana" : "semanas";
    return `${base} — ${alerta}${linha.semanasSemCheckin} ${plural} sem check-in`;
  };

  const secaoPostaram = postaram.length
    ? postaram.map((l) => formataLinha(l)).join("\n")
    : mensagens.get("resumo_postaram_vazio");

  const secaoNaoPostaram = naoPostaram.length
    ? naoPostaram.map((l) => formataLinha(l, true)).join("\n")
    : mensagens.get("resumo_nao_postaram_vazio");

  return mensagens.get("resumo_semanal", {
    inicio,
    fim,
    n_postaram: String(postaram.length),
    total: String(total),
    secao_postaram: secaoPostaram,
    n_nao_postaram: String(naoPostaram.length),
    secao_nao_postaram: secaoNaoPostaram,
    taxa: String(taxa),
  });
}

export function mensagemAlertaInativos(inativos: LinhaResumo[]): string {
  const prefixes = Object.keys(appConfig.prefixos);
  const linhas = inativos
    .map((l) => {
      const nome = displayNameFromChannel(l.nomeCanal, prefixes);
      return `- ${nome} (${labelDoNivel(l.nivel)}) — ${l.semanasSemCheckin} semanas sem check-in`;
    })
    .join("\n");
  return mensagens.get("alerta_inativos", { linhas });
}

export function mensagemStatus(
  isoWeek: string,
  postaram: Array<{ nomeCanal: string; nivel: string }>,
  naoPostaram: Array<{ nomeCanal: string; nivel: string }>,
): string {
  const total = postaram.length + naoPostaram.length;
  const taxa = total === 0 ? 0 : Math.round((postaram.length / total) * 100);
  const { inicio, fim } = formatWeekRange(isoWeek);
  const prefixes = Object.keys(appConfig.prefixos);

  const fmt = (r: { nomeCanal: string; nivel: string }) =>
    `- ${displayNameFromChannel(r.nomeCanal, prefixes)} (${labelDoNivel(r.nivel)})`;

  const linhasPostaram = postaram.length
    ? postaram.map(fmt).join("\n")
    : mensagens.get("cmd_status_postaram_vazio");

  const linhasNao = naoPostaram.length
    ? naoPostaram.map(fmt).join("\n")
    : mensagens.get("resumo_nao_postaram_vazio");

  return mensagens.get("cmd_status_conteudo", {
    inicio,
    fim,
    n_postaram: String(postaram.length),
    total: String(total),
    linhas_postaram: linhasPostaram,
    n_nao_postaram: String(naoPostaram.length),
    linhas_nao: linhasNao,
    taxa: String(taxa),
  });
}
