import { config } from "../config";

export interface IConfigRepository {
  getOrientadorId(): string;
  getTimezone(): string;
  getCategoriaOrientacoes(): string;
  getCanalBoasVindas(): string;
  getHorarios(): {
    lembrete: string;
    cobranca: string;
    resumo: string;
    limpeza: string;
  };
  getLimites(): {
    mensagensPorCiclo: number;
    dmsPorCiclo: number;
    cooldownMs: number;
  };
  getRetencaoMeses(): number;
}

export class EnvConfigRepository implements IConfigRepository {
  getOrientadorId(): string {
    return config.orientadorId;
  }
  getTimezone(): string {
    return config.timezone;
  }
  getCategoriaOrientacoes(): string {
    return config.categoriaOrientacoes;
  }
  getCanalBoasVindas(): string {
    return config.canalBoasVindas;
  }
  getHorarios(): {
    lembrete: string;
    cobranca: string;
    resumo: string;
    limpeza: string;
  } {
    return config.horarios;
  }
  getLimites(): {
    mensagensPorCiclo: number;
    dmsPorCiclo: number;
    cooldownMs: number;
  } {
    return config.limites;
  }
  getRetencaoMeses(): number {
    return config.retencao.meses;
  }
}

export const configRepo = new EnvConfigRepository();
