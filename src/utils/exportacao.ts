import { labelDoNivel } from "../config/appConfig";
import {
  type CheckinFilter,
  type CheckinRow,
  type ICheckinRepository,
} from "../repositories";
import { currentIsoWeek } from "./semana";

const VERSAO_EXPORTACAO = "1.3.0";
const SERVIDOR_EXPORTACAO = "ASSERT Lab (CIn-UFPE)";

export interface RegistroExportado {
  canal: string;
  nivel: string;
  label: string;
  semana: string;
  checkin_realizado: boolean;
  data_checkin: string | null;
  semanas_consecutivas_sem_checkin: number;
}

export interface JsonExportado {
  exportacao: {
    data: string;
    versao: string;
    servidor: string;
    filtro: string;
  };
  registros: RegistroExportado[];
  resumo: {
    total_registros: number;
    total_checkins_realizados: number;
    taxa_adesao: string;
  };
}

export function semanaDeMesesAtras(
  meses: number,
  timezone: string,
  now: Date = new Date(),
): string {
  const past = new Date(now.getTime());
  past.setMonth(past.getMonth() - meses);
  return currentIsoWeek(timezone, past);
}

export interface MontarExportacaoOpts {
  filtro: CheckinFilter;
  filtroLabel: string;
  rows: CheckinRow[];
  repo: ICheckinRepository;
  timezone: string;
  agora?: Date;
}

export function montarExportacao(opts: MontarExportacaoOpts): JsonExportado {
  const agora = opts.agora ?? new Date();
  const semanaAtual = currentIsoWeek(opts.timezone, agora);

  const canalIds = Array.from(new Set(opts.rows.map((r) => r.canalId)));
  const consecutivasPorCanal = new Map<string, number>();
  for (const canalId of canalIds) {
    consecutivasPorCanal.set(
      canalId,
      opts.repo.semanasConsecutivasSemCheckin(canalId, semanaAtual),
    );
  }

  const registros: RegistroExportado[] = opts.rows.map((r) => ({
    canal: r.nomeCanal,
    nivel: r.nivel,
    label: labelDoNivel(r.nivel),
    semana: r.semana,
    checkin_realizado: r.checkinRealizado === 1,
    data_checkin: r.dataCheckin,
    semanas_consecutivas_sem_checkin:
      consecutivasPorCanal.get(r.canalId) ?? 0,
  }));

  const realizados = registros.filter((r) => r.checkin_realizado).length;
  const taxa =
    registros.length === 0
      ? "0.0%"
      : `${((realizados / registros.length) * 100).toFixed(1)}%`;

  return {
    exportacao: {
      data: agora.toISOString(),
      versao: VERSAO_EXPORTACAO,
      servidor: SERVIDOR_EXPORTACAO,
      filtro: opts.filtroLabel,
    },
    registros,
    resumo: {
      total_registros: registros.length,
      total_checkins_realizados: realizados,
      taxa_adesao: taxa,
    },
  };
}

export function nomeArquivoExportacao(filtroLabel: string, agora: Date = new Date()): string {
  const slug = filtroLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "exportacao";
  const stamp = agora.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `cutucao-${slug}-${stamp}.json`;
}
