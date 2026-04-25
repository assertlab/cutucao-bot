import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SQLiteCheckinRepository } from "../../repositories/checkinRepository";

let db: Database.Database;
let repo: SQLiteCheckinRepository;

beforeEach(() => {
  db = new Database(":memory:");
  repo = new SQLiteCheckinRepository(db);
});

afterEach(() => {
  db.close();
});

const canal = {
  canalId: "111222333444555666",
  nomeCanal: "msc-alana-fernandes",
  nivel: "msc",
};

describe("registrarLembrete", () => {
  it("creates a new record with checkinRealizado=0", () => {
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    const rows = repo.listarStatusSemana("2026-W17");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.checkinRealizado).toBe(0);
    expect(rows[0]?.canalId).toBe(canal.canalId);
  });

  it("is idempotent — upsert on conflict does not raise", () => {
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    expect(repo.listarStatusSemana("2026-W17")).toHaveLength(1);
  });

  it("does not overwrite an existing check-in", () => {
    repo.registrarCheckin({ ...canal, semana: "2026-W17", dataCheckin: new Date() });
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    const row = repo.listarStatusSemana("2026-W17")[0];
    expect(row?.checkinRealizado).toBe(1);
  });
});

describe("registrarCheckin", () => {
  it("marks checkin as done and returns novo:true", () => {
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    const result = repo.registrarCheckin({
      ...canal,
      semana: "2026-W17",
      dataCheckin: new Date("2026-04-20T10:00:00.000Z"),
    });
    expect(result.novo).toBe(true);
    const row = repo.listarStatusSemana("2026-W17")[0];
    expect(row?.checkinRealizado).toBe(1);
    expect(row?.dataCheckin).toBeTruthy();
  });

  it("returns novo:false on second check-in for the same week", () => {
    repo.registrarCheckin({ ...canal, semana: "2026-W17", dataCheckin: new Date() });
    const result = repo.registrarCheckin({
      ...canal,
      semana: "2026-W17",
      dataCheckin: new Date(),
    });
    expect(result.novo).toBe(false);
  });

  it("registers independently across different weeks", () => {
    repo.registrarCheckin({ ...canal, semana: "2026-W16", dataCheckin: new Date() });
    repo.registrarCheckin({ ...canal, semana: "2026-W17", dataCheckin: new Date() });
    expect(repo.listarStatusSemana("2026-W16")).toHaveLength(1);
    expect(repo.listarStatusSemana("2026-W17")).toHaveLength(1);
  });

  it("accepts custom nivel string", () => {
    const canalPos = { ...canal, nivel: "pos", nomeCanal: "pos-joao-silva" };
    repo.registrarLembrete({ ...canalPos, semana: "2026-W17" });
    const row = repo.listarStatusSemana("2026-W17")[0];
    expect(row?.nivel).toBe("pos");
  });
});

describe("listarStatusSemana", () => {
  it("returns empty array when no records exist", () => {
    expect(repo.listarStatusSemana("2026-W17")).toHaveLength(0);
  });

  it("returns only records for the requested week", () => {
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    repo.registrarLembrete({ ...canal, semana: "2026-W18" });
    expect(repo.listarStatusSemana("2026-W17")).toHaveLength(1);
  });
});

describe("semanasConsecutivasSemCheckin", () => {
  it("returns 0 when no records exist", () => {
    expect(repo.semanasConsecutivasSemCheckin(canal.canalId, "2026-W17")).toBe(0);
  });

  it("returns 0 when the current week has a check-in", () => {
    repo.registrarCheckin({ ...canal, semana: "2026-W17", dataCheckin: new Date() });
    expect(repo.semanasConsecutivasSemCheckin(canal.canalId, "2026-W17")).toBe(0);
  });

  it("counts consecutive weeks without check-in", () => {
    // Week 15: checked in; Weeks 16 and 17: no check-in
    repo.registrarCheckin({ ...canal, semana: "2026-W15", dataCheckin: new Date() });
    repo.registrarLembrete({ ...canal, semana: "2026-W16" });
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    expect(repo.semanasConsecutivasSemCheckin(canal.canalId, "2026-W17")).toBe(2);
  });

  it("stops counting at a week with a check-in", () => {
    repo.registrarCheckin({ ...canal, semana: "2026-W16", dataCheckin: new Date() });
    repo.registrarLembrete({ ...canal, semana: "2026-W17" });
    expect(repo.semanasConsecutivasSemCheckin(canal.canalId, "2026-W17")).toBe(1);
  });
});

describe("listarHistoricoCanal", () => {
  it("returns empty array for unknown channel", () => {
    expect(repo.listarHistoricoCanal("nao-existe")).toHaveLength(0);
  });

  it("returns up to 52 weeks ordered DESC", () => {
    for (let w = 1; w <= 5; w++) {
      const semana = `2026-W${String(w).padStart(2, "0")}`;
      repo.registrarLembrete({ ...canal, semana });
    }
    const historico = repo.listarHistoricoCanal(canal.canalId);
    expect(historico).toHaveLength(5);
    // Should be ordered descending
    expect(historico[0]?.semana).toBe("2026-W05");
    expect(historico[4]?.semana).toBe("2026-W01");
  });
});

const canalPhd = {
  canalId: "200000000000000001",
  nomeCanal: "phd-jack-bauer",
  nivel: "phd",
};
const canalMsc1 = {
  canalId: "200000000000000002",
  nomeCanal: "msc-natasha-romanoff",
  nivel: "msc",
};
const canalMsc2 = {
  canalId: "200000000000000003",
  nomeCanal: "msc-harry-potter",
  nivel: "msc",
};
const canalBsc = {
  canalId: "200000000000000004",
  nomeCanal: "bsc-ron-weasley",
  nivel: "bsc",
};

function popularBase(): void {
  repo.registrarCheckin({ ...canalPhd, semana: "2026-W10", dataCheckin: new Date("2026-03-02T10:00:00Z") });
  repo.registrarLembrete({ ...canalPhd, semana: "2026-W11" });
  repo.registrarCheckin({ ...canalMsc1, semana: "2026-W11", dataCheckin: new Date("2026-03-09T10:00:00Z") });
  repo.registrarCheckin({ ...canalMsc2, semana: "2026-W12", dataCheckin: new Date("2026-03-16T10:00:00Z") });
  repo.registrarLembrete({ ...canalBsc, semana: "2026-W12" });
  repo.registrarCheckin({ ...canalBsc, semana: "2026-W13", dataCheckin: new Date("2026-03-23T10:00:00Z") });
}

describe("contarRegistros / contarCanaisMonitorados", () => {
  it("returns zero for empty database", () => {
    expect(repo.contarRegistros()).toBe(0);
    expect(repo.contarCanaisMonitorados()).toBe(0);
  });

  it("counts total rows and distinct channels", () => {
    popularBase();
    expect(repo.contarRegistros()).toBe(6);
    expect(repo.contarCanaisMonitorados()).toBe(4);
  });
});

describe("contarRegistrosPorNivel", () => {
  it("returns empty array when there are no records", () => {
    expect(repo.contarRegistrosPorNivel()).toEqual([]);
  });

  it("groups counts by nivel sorted alphabetically", () => {
    popularBase();
    const counts = repo.contarRegistrosPorNivel();
    expect(counts).toEqual([
      { nivel: "bsc", total: 2 },
      { nivel: "msc", total: 2 },
      { nivel: "phd", total: 2 },
    ]);
  });
});

describe("registroMaisAntigo / registroMaisRecente", () => {
  it("returns null when there are no records", () => {
    expect(repo.registroMaisAntigo()).toBeNull();
    expect(repo.registroMaisRecente()).toBeNull();
  });

  it("returns the lowest and highest ISO weeks", () => {
    popularBase();
    expect(repo.registroMaisAntigo()).toBe("2026-W10");
    expect(repo.registroMaisRecente()).toBe("2026-W13");
  });
});

describe("exportarRegistros", () => {
  it("returns all rows when filter=tudo", () => {
    popularBase();
    const rows = repo.exportarRegistros({ tipo: "tudo" });
    expect(rows).toHaveLength(6);
  });

  it("returns rows for a specific channel", () => {
    popularBase();
    const rows = repo.exportarRegistros({ tipo: "canal", canalId: canalMsc1.canalId });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.nomeCanal).toBe("msc-natasha-romanoff");
  });

  it("returns rows for a specific nivel", () => {
    popularBase();
    const rows = repo.exportarRegistros({ tipo: "nivel", nivel: "msc" });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.nivel === "msc")).toBe(true);
  });

  it("returns rows from semana >= cutoff for periodo filter", () => {
    popularBase();
    const rows = repo.exportarRegistros({ tipo: "periodo", semanaInicio: "2026-W12" });
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.semana >= "2026-W12")).toBe(true);
  });

  it("returns rows for a list of channel names", () => {
    popularBase();
    const rows = repo.exportarRegistros({
      tipo: "canais",
      nomesCanais: ["phd-jack-bauer", "bsc-ron-weasley"],
    });
    // canalPhd has 2 rows (W10, W11), canalBsc has 2 rows (W12, W13)
    expect(rows).toHaveLength(4);
    expect(
      rows.every(
        (r) => r.nomeCanal === "phd-jack-bauer" || r.nomeCanal === "bsc-ron-weasley",
      ),
    ).toBe(true);
  });

  it("returns empty array for canais filter with empty list", () => {
    popularBase();
    const rows = repo.exportarRegistros({ tipo: "canais", nomesCanais: [] });
    expect(rows).toEqual([]);
  });
});

describe("limparRegistros", () => {
  it("returns 0 when there is nothing to delete", () => {
    expect(repo.limparRegistros({ tipo: "tudo" })).toBe(0);
  });

  it("deletes all rows when filter=tudo", () => {
    popularBase();
    expect(repo.limparRegistros({ tipo: "tudo" })).toBe(6);
    expect(repo.contarRegistros()).toBe(0);
  });

  it("deletes only rows from a specific channel", () => {
    popularBase();
    const removed = repo.limparRegistros({
      tipo: "canal",
      canalId: canalMsc1.canalId,
    });
    expect(removed).toBe(1);
    expect(repo.contarRegistros()).toBe(5);
  });

  it("deletes only rows from a specific nivel", () => {
    popularBase();
    const removed = repo.limparRegistros({ tipo: "nivel", nivel: "msc" });
    expect(removed).toBe(2);
    expect(repo.contarRegistrosPorNivel().some((r) => r.nivel === "msc")).toBe(false);
  });

  it("deletes only rows for the listed channel names", () => {
    popularBase();
    const removed = repo.limparRegistros({
      tipo: "canais",
      nomesCanais: ["bsc-ron-weasley"],
    });
    expect(removed).toBe(2);
    expect(repo.contarRegistros()).toBe(4);
  });

  it("does nothing for canais filter with empty list", () => {
    popularBase();
    expect(repo.limparRegistros({ tipo: "canais", nomesCanais: [] })).toBe(0);
    expect(repo.contarRegistros()).toBe(6);
  });

  it("deletes only rows from semana >= cutoff", () => {
    popularBase();
    const removed = repo.limparRegistros({ tipo: "periodo", semanaInicio: "2026-W12" });
    expect(removed).toBe(3);
    expect(repo.registroMaisRecente()).toBe("2026-W11");
  });
});
