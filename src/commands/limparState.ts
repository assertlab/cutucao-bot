import { type CheckinFilter } from "../repositories";

export interface LimparPendente {
  filtro: CheckinFilter;
  filtroLabel: string;
  total: number;
  iniciadoEm: number;
}

const TTL_MS = 5 * 60 * 1000;
const pendentes = new Map<string, LimparPendente>();

function purgarExpirados(agora: number): void {
  for (const [id, p] of pendentes.entries()) {
    if (agora - p.iniciadoEm > TTL_MS) pendentes.delete(id);
  }
}

export function salvarPendente(
  id: string,
  pendente: Omit<LimparPendente, "iniciadoEm">,
): void {
  const agora = Date.now();
  purgarExpirados(agora);
  pendentes.set(id, { ...pendente, iniciadoEm: agora });
}

export function lerPendente(id: string): LimparPendente | undefined {
  const agora = Date.now();
  purgarExpirados(agora);
  return pendentes.get(id);
}

export function descartarPendente(id: string): void {
  pendentes.delete(id);
}

export function tamanhoPendentes(): number {
  return pendentes.size;
}

export function limparTodosPendentes(): void {
  pendentes.clear();
}

export const TTL_PENDENTE_MS = TTL_MS;
