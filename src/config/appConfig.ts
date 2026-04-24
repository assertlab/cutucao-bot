import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import cron from "node-cron";

export interface AppConfig {
  categorias: string[];
  prefixos: Record<string, string>;
  canal_boas_vindas: string;
  horarios: {
    lembrete: string;
    cobranca: string;
    resumo: string;
  };
  escalacao: {
    semanas_para_cobranca_dm: number;
    semanas_para_alerta: number;
  };
  visualizacao: {
    semanas_historico_padrao: number;
    meses_resumo_padrao: number;
  };
}

const DEFAULTS: AppConfig = {
  categorias: ["Orientações"],
  prefixos: {
    phd: "Doutorado",
    msc: "Mestrado",
    bsc: "Graduação",
  },
  canal_boas_vindas: "boas-vindas-e-regras",
  horarios: {
    lembrete: "0 9 * * 1",
    cobranca: "0 9 * * 3",
    resumo: "0 18 * * 5",
  },
  escalacao: {
    semanas_para_cobranca_dm: 2,
    semanas_para_alerta: 3,
  },
  visualizacao: {
    semanas_historico_padrao: 4,
    meses_resumo_padrao: 6,
  },
};

function validate(cfg: AppConfig): void {
  if (cfg.categorias.length === 0) {
    throw new Error("🐕 config.json inválido: 'categorias' não pode ser vazio.");
  }
  if (Object.keys(cfg.prefixos).length === 0) {
    throw new Error("🐕 config.json inválido: 'prefixos' não pode ser vazio.");
  }
  const cronFields: Array<[string, string]> = [
    ["horarios.lembrete", cfg.horarios.lembrete],
    ["horarios.cobranca", cfg.horarios.cobranca],
    ["horarios.resumo", cfg.horarios.resumo],
  ];
  for (const [campo, expr] of cronFields) {
    if (!cron.validate(expr)) {
      throw new Error(
        `🐕 config.json inválido: cron expression inválida em '${campo}': "${expr}". O bot não pode iniciar.`,
      );
    }
  }
}

export function loadAppConfig(configPath?: string): AppConfig {
  const path = configPath ?? join(process.cwd(), "config.json");
  if (!existsSync(path)) {
    return { ...DEFAULTS, horarios: { ...DEFAULTS.horarios }, escalacao: { ...DEFAULTS.escalacao }, visualizacao: { ...DEFAULTS.visualizacao } };
  }

  let raw: Record<string, unknown>;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("deve ser um objeto JSON.");
    }
    raw = Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(([k]) => !k.startsWith("_")),
    );
  } catch (err) {
    throw new Error(
      `🐕 Falha ao ler config.json: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const rawHorarios = (typeof raw["horarios"] === "object" && raw["horarios"] !== null && !Array.isArray(raw["horarios"]))
    ? (raw["horarios"] as Record<string, unknown>)
    : {};

  const cfg: AppConfig = {
    categorias: Array.isArray(raw["categorias"])
      ? (raw["categorias"] as unknown[]).filter((s): s is string => typeof s === "string")
      : DEFAULTS.categorias,
    prefixos: (typeof raw["prefixos"] === "object" && raw["prefixos"] !== null && !Array.isArray(raw["prefixos"]))
      ? (raw["prefixos"] as Record<string, string>)
      : DEFAULTS.prefixos,
    canal_boas_vindas: typeof raw["canal_boas_vindas"] === "string"
      ? raw["canal_boas_vindas"]
      : DEFAULTS.canal_boas_vindas,
    horarios: {
      lembrete: typeof rawHorarios["lembrete"] === "string" ? rawHorarios["lembrete"] : DEFAULTS.horarios.lembrete,
      cobranca: typeof rawHorarios["cobranca"] === "string" ? rawHorarios["cobranca"] : DEFAULTS.horarios.cobranca,
      resumo: typeof rawHorarios["resumo"] === "string" ? rawHorarios["resumo"] : DEFAULTS.horarios.resumo,
    },
    escalacao: {
      ...DEFAULTS.escalacao,
      ...(typeof raw["escalacao"] === "object" && raw["escalacao"] !== null && !Array.isArray(raw["escalacao"])
        ? (raw["escalacao"] as Partial<AppConfig["escalacao"]>)
        : {}),
    },
    visualizacao: {
      ...DEFAULTS.visualizacao,
      ...(typeof raw["visualizacao"] === "object" && raw["visualizacao"] !== null && !Array.isArray(raw["visualizacao"])
        ? (raw["visualizacao"] as Partial<AppConfig["visualizacao"]>)
        : {}),
    },
  };

  validate(cfg);
  return cfg;
}

export const appConfig: AppConfig = loadAppConfig();

export function labelDoNivel(nivel: string): string {
  return appConfig.prefixos[nivel] ?? nivel;
}
