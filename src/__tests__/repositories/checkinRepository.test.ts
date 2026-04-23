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
  nivel: "msc" as const,
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

describe("limparHistoricoAntigo", () => {
  it("removes old records and returns count", () => {
    // Insert a check-in with a very old date
    const oldDate = new Date("2020-01-01T00:00:00.000Z");
    repo.registrarCheckin({ ...canal, semana: "2020-W01", dataCheckin: oldDate });
    // Insert a recent check-in
    repo.registrarCheckin({ ...canal, semana: "2026-W17", dataCheckin: new Date() });

    const removed = repo.limparHistoricoAntigo(6);
    expect(removed).toBeGreaterThan(0);

    // Recent check-in should still be there
    expect(repo.listarStatusSemana("2026-W17")).toHaveLength(1);
  });
});
