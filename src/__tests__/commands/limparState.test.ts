import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  descartarPendente,
  lerPendente,
  limparTodosPendentes,
  salvarPendente,
  tamanhoPendentes,
  TTL_PENDENTE_MS,
} from "../../commands/limparState";

beforeEach(() => {
  limparTodosPendentes();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("limparState", () => {
  it("starts empty", () => {
    expect(tamanhoPendentes()).toBe(0);
    expect(lerPendente("nao-existe")).toBeUndefined();
  });

  it("salvarPendente + lerPendente round-trip preserves filter", () => {
    salvarPendente("interaction-1", {
      filtro: { tipo: "nivel", nivel: "msc" },
      filtroLabel: "nível: Mestrado",
      total: 5,
    });
    const pendente = lerPendente("interaction-1");
    expect(pendente).toBeDefined();
    expect(pendente?.filtro).toEqual({ tipo: "nivel", nivel: "msc" });
    expect(pendente?.total).toBe(5);
  });

  it("descartarPendente removes the entry", () => {
    salvarPendente("x", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 10,
    });
    expect(lerPendente("x")).toBeDefined();
    descartarPendente("x");
    expect(lerPendente("x")).toBeUndefined();
  });

  it("expires entries older than TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T10:00:00Z"));
    salvarPendente("expira", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 1,
    });
    expect(lerPendente("expira")).toBeDefined();

    // Advance past the TTL
    vi.setSystemTime(new Date(Date.now() + TTL_PENDENTE_MS + 1000));
    expect(lerPendente("expira")).toBeUndefined();
  });

  it("does NOT expire entries within TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T10:00:00Z"));
    salvarPendente("vivo", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 1,
    });
    vi.setSystemTime(new Date(Date.now() + TTL_PENDENTE_MS - 1000));
    expect(lerPendente("vivo")).toBeDefined();
  });
});
