import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SQLiteCheckinRepository } from "../../repositories/checkinRepository";
import {
  montarExportacao,
  nomeArquivoExportacao,
  semanaDeMesesAtras,
} from "../../utils/exportacao";

let db: Database.Database;
let repo: SQLiteCheckinRepository;

beforeEach(() => {
  db = new Database(":memory:");
  repo = new SQLiteCheckinRepository(db);
});

afterEach(() => {
  db.close();
});

const canalA = {
  canalId: "300000000000000001",
  nomeCanal: "msc-alana-fernandes",
  nivel: "msc",
};
const canalB = {
  canalId: "300000000000000002",
  nomeCanal: "phd-jack-bauer",
  nivel: "phd",
};

describe("semanaDeMesesAtras", () => {
  it("returns the ISO week N months before now", () => {
    const now = new Date("2026-04-25T12:00:00Z");
    const result = semanaDeMesesAtras(6, "UTC", now);
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
    // 6 months before April 25, 2026 = around late October 2025
    expect(result.startsWith("2025-W")).toBe(true);
  });

  it("handles 0 months (same week)", () => {
    const now = new Date("2026-04-22T12:00:00Z");
    expect(semanaDeMesesAtras(0, "UTC", now)).toBe("2026-W17");
  });
});

describe("montarExportacao", () => {
  it("includes the metadata block", () => {
    repo.registrarCheckin({ ...canalA, semana: "2026-W17", dataCheckin: new Date("2026-04-21T10:00:00Z") });
    const rows = repo.exportarRegistros({ tipo: "tudo" });
    const json = montarExportacao({
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      rows,
      repo,
      timezone: "UTC",
      agora: new Date("2026-04-25T18:00:00Z"),
    });

    expect(json.exportacao).toEqual({
      data: "2026-04-25T18:00:00.000Z",
      versao: "1.3.0",
      servidor: "ASSERT Lab (CIn-UFPE)",
      filtro: "tudo",
    });
  });

  it("converts checkinRealizado int to boolean", () => {
    repo.registrarCheckin({ ...canalA, semana: "2026-W17", dataCheckin: new Date("2026-04-21T10:00:00Z") });
    repo.registrarLembrete({ ...canalB, semana: "2026-W17" });
    const rows = repo.exportarRegistros({ tipo: "tudo" });
    const json = montarExportacao({
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      rows,
      repo,
      timezone: "UTC",
    });

    const realizados = json.registros.filter((r) => r.checkin_realizado);
    expect(realizados).toHaveLength(1);
    expect(realizados[0]?.canal).toBe("msc-alana-fernandes");
  });

  it("computes total_checkins_realizados and taxa_adesao", () => {
    repo.registrarCheckin({ ...canalA, semana: "2026-W16", dataCheckin: new Date() });
    repo.registrarCheckin({ ...canalA, semana: "2026-W17", dataCheckin: new Date() });
    repo.registrarLembrete({ ...canalB, semana: "2026-W17" });
    const rows = repo.exportarRegistros({ tipo: "tudo" });
    const json = montarExportacao({
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      rows,
      repo,
      timezone: "UTC",
    });

    expect(json.resumo.total_registros).toBe(3);
    expect(json.resumo.total_checkins_realizados).toBe(2);
    expect(json.resumo.taxa_adesao).toBe("66.7%");
  });

  it("handles empty rows gracefully", () => {
    const json = montarExportacao({
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      rows: [],
      repo,
      timezone: "UTC",
    });
    expect(json.registros).toEqual([]);
    expect(json.resumo.taxa_adesao).toBe("0.0%");
  });

  it("includes the canal label from configured prefixos", () => {
    repo.registrarCheckin({ ...canalB, semana: "2026-W17", dataCheckin: new Date() });
    const rows = repo.exportarRegistros({ tipo: "tudo" });
    const json = montarExportacao({
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      rows,
      repo,
      timezone: "UTC",
    });
    expect(json.registros[0]?.label).toBe("Doutorado");
  });
});

describe("nomeArquivoExportacao", () => {
  it("produces a valid file name with timestamp", () => {
    const name = nomeArquivoExportacao("tudo", new Date("2026-04-25T18:00:00Z"));
    expect(name).toBe("cutucao-tudo-2026-04-25T18-00-00.json");
  });

  it("slugifies the filtro label", () => {
    const name = nomeArquivoExportacao(
      "canal: msc-alana-fernandes (Alana)",
      new Date("2026-04-25T18:00:00Z"),
    );
    expect(name).toMatch(/^cutucao-canal-msc-alana-fernandes-alana-/);
    expect(name.endsWith(".json")).toBe(true);
  });

  it("falls back to 'exportacao' for empty/garbage labels", () => {
    const name = nomeArquivoExportacao("!!!", new Date("2026-04-25T18:00:00Z"));
    expect(name.startsWith("cutucao-exportacao-")).toBe(true);
  });
});
