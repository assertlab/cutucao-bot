import { log } from "./log";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RateLimitOptions {
  limite: number;
  cooldownMs: number;
  rotulo: string;
}

export async function forEachComRateLimit<T>(
  itens: T[],
  opcoes: RateLimitOptions,
  acao: (item: T) => Promise<void>,
): Promise<number> {
  let enviados = 0;
  for (const item of itens) {
    if (enviados >= opcoes.limite) {
      log.warn(
        `Rate limit interno atingido em ${opcoes.rotulo}. Abortando envio.`,
        { limite: opcoes.limite, restantes: itens.length - enviados },
      );
      break;
    }
    try {
      await acao(item);
      enviados++;
    } catch (err) {
      log.error(`Falha ao processar item em ${opcoes.rotulo}`, err);
    }
    if (enviados < opcoes.limite) {
      await sleep(opcoes.cooldownMs);
    }
  }
  return enviados;
}

export class CircuitBreaker {
  private falhas = 0;
  private abertoAte = 0;

  constructor(
    private readonly rotulo: string,
    private readonly limiteFalhas = 3,
    private readonly tempoAberturaMs = 60 * 60 * 1000,
  ) {}

  estaAberto(): boolean {
    return Date.now() < this.abertoAte;
  }

  registrarSucesso(): void {
    this.falhas = 0;
  }

  registrarFalha(): boolean {
    this.falhas++;
    if (this.falhas >= this.limiteFalhas) {
      this.abertoAte = Date.now() + this.tempoAberturaMs;
      this.falhas = 0;
      log.warn(`Circuit breaker aberto para ${this.rotulo}.`, {
        reabrirEm: new Date(this.abertoAte).toISOString(),
      });
      return true;
    }
    return false;
  }
}
