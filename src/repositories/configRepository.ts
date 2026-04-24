import { appConfig } from "../config/appConfig";
import { config } from "../config";

export interface IConfigRepository {
  getOrientadorId(): string;
  getTimezone(): string;
  getCategorias(): string[];
  getPrefixos(): Record<string, string>;
  getCanalBoasVindas(): string;
  getHorarios(): {
    lembrete: string;
    cobranca: string;
    resumo: string;
  };
  getLimites(): {
    mensagensPorCiclo: number;
    dmsPorCiclo: number;
    cooldownMs: number;
  };
  getEscalacao(): {
    semanas_para_cobranca_dm: number;
    semanas_para_alerta: number;
  };
  getVisualizacao(): {
    semanas_historico_padrao: number;
    meses_resumo_padrao: number;
  };
}

export class EnvConfigRepository implements IConfigRepository {
  getOrientadorId(): string {
    return config.orientadorId;
  }
  getTimezone(): string {
    return config.timezone;
  }
  getCategorias(): string[] {
    return appConfig.categorias;
  }
  getPrefixos(): Record<string, string> {
    return appConfig.prefixos;
  }
  getCanalBoasVindas(): string {
    return appConfig.canal_boas_vindas;
  }
  getHorarios(): { lembrete: string; cobranca: string; resumo: string } {
    return appConfig.horarios;
  }
  getLimites(): { mensagensPorCiclo: number; dmsPorCiclo: number; cooldownMs: number } {
    return config.limites;
  }
  getEscalacao(): { semanas_para_cobranca_dm: number; semanas_para_alerta: number } {
    return appConfig.escalacao;
  }
  getVisualizacao(): { semanas_historico_padrao: number; meses_resumo_padrao: number } {
    return appConfig.visualizacao;
  }
}

export const configRepo = new EnvConfigRepository();
