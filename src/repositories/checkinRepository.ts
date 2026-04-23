import Database from "better-sqlite3";
import { isoWeekOffset } from "../utils/semana";

export type Nivel = "phd" | "msc" | "bsc";

export interface CheckinRow {
  canalId: string;
  nomeCanal: string;
  nivel: Nivel;
  semana: string;
  checkinRealizado: 0 | 1;
  dataCheckin: string | null;
}

export interface ICheckinRepository {
  registrarLembrete(input: {
    canalId: string;
    nomeCanal: string;
    nivel: Nivel;
    semana: string;
  }): void;
  registrarCheckin(input: {
    canalId: string;
    nomeCanal: string;
    nivel: Nivel;
    semana: string;
    dataCheckin: Date;
  }): { novo: boolean };
  listarStatusSemana(semana: string): CheckinRow[];
  semanasConsecutivasSemCheckin(canalId: string, semanaAtual: string): number;
  listarHistoricoCanal(
    canalId: string,
  ): Array<{ semana: string; checkinRealizado: 0 | 1 }>;
  limparHistoricoAntigo(meses: number): number;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS checkins (
    canalId TEXT NOT NULL,
    nomeCanal TEXT NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('phd', 'msc', 'bsc')),
    semana TEXT NOT NULL,
    checkinRealizado INTEGER NOT NULL DEFAULT 0 CHECK (checkinRealizado IN (0, 1)),
    dataCheckin TEXT,
    PRIMARY KEY (canalId, semana)
  );
  CREATE INDEX IF NOT EXISTS idx_checkins_semana ON checkins(semana);
  CREATE INDEX IF NOT EXISTS idx_checkins_canal ON checkins(canalId);
`;

export class SQLiteCheckinRepository implements ICheckinRepository {
  private readonly stmts: {
    upsertLembrete: Database.Statement;
    registrarCheckin: Database.Statement;
    getRow: Database.Statement;
    canaisDaSemana: Database.Statement;
    historicoCanal: Database.Statement;
    limparAntigos: Database.Statement;
    limparRowsSemCheckinAntigos: Database.Statement;
  };

  constructor(private readonly db: Database.Database) {
    db.exec(SCHEMA_SQL);
    this.stmts = {
      upsertLembrete: db.prepare(`
        INSERT INTO checkins (canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin)
        VALUES (@canalId, @nomeCanal, @nivel, @semana, 0, NULL)
        ON CONFLICT(canalId, semana) DO UPDATE SET
          nomeCanal = excluded.nomeCanal,
          nivel = excluded.nivel
      `),
      registrarCheckin: db.prepare(`
        INSERT INTO checkins (canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin)
        VALUES (@canalId, @nomeCanal, @nivel, @semana, 1, @dataCheckin)
        ON CONFLICT(canalId, semana) DO UPDATE SET
          nomeCanal = excluded.nomeCanal,
          nivel = excluded.nivel,
          checkinRealizado = 1,
          dataCheckin = COALESCE(checkins.dataCheckin, excluded.dataCheckin)
      `),
      getRow: db.prepare(`
        SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
        FROM checkins
        WHERE canalId = ? AND semana = ?
      `),
      canaisDaSemana: db.prepare(`
        SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
        FROM checkins
        WHERE semana = ?
      `),
      historicoCanal: db.prepare(`
        SELECT semana, checkinRealizado
        FROM checkins
        WHERE canalId = ?
        ORDER BY semana DESC
        LIMIT 52
      `),
      limparAntigos: db.prepare(`
        DELETE FROM checkins WHERE dataCheckin IS NOT NULL AND dataCheckin < ?
      `),
      limparRowsSemCheckinAntigos: db.prepare(`
        DELETE FROM checkins WHERE checkinRealizado = 0 AND semana < ?
      `),
    };
  }

  registrarLembrete(input: {
    canalId: string;
    nomeCanal: string;
    nivel: Nivel;
    semana: string;
  }): void {
    this.stmts.upsertLembrete.run(input);
  }

  registrarCheckin(input: {
    canalId: string;
    nomeCanal: string;
    nivel: Nivel;
    semana: string;
    dataCheckin: Date;
  }): { novo: boolean } {
    const existente = this.stmts.getRow.get(
      input.canalId,
      input.semana,
    ) as CheckinRow | undefined;
    if (existente?.checkinRealizado === 1) return { novo: false };
    this.stmts.registrarCheckin.run({
      ...input,
      dataCheckin: input.dataCheckin.toISOString(),
    });
    return { novo: true };
  }

  listarStatusSemana(semana: string): CheckinRow[] {
    return this.stmts.canaisDaSemana.all(semana) as CheckinRow[];
  }

  semanasConsecutivasSemCheckin(
    canalId: string,
    semanaAtual: string,
  ): number {
    const linhas = this.stmts.historicoCanal.all(canalId) as Array<{
      semana: string;
      checkinRealizado: 0 | 1;
    }>;
    const porSemana = new Map<string, 0 | 1>();
    for (const linha of linhas) porSemana.set(linha.semana, linha.checkinRealizado);

    let contador = 0;
    let cursor = semanaAtual;
    for (let i = 0; i < 52; i++) {
      const flag = porSemana.get(cursor);
      if (flag === undefined || flag === 1) break;
      contador++;
      cursor = isoWeekOffset(cursor, -1);
    }
    return contador;
  }

  listarHistoricoCanal(
    canalId: string,
  ): Array<{ semana: string; checkinRealizado: 0 | 1 }> {
    return this.stmts.historicoCanal.all(canalId) as Array<{
      semana: string;
      checkinRealizado: 0 | 1;
    }>;
  }

  limparHistoricoAntigo(meses: number): number {
    const corte = new Date();
    corte.setMonth(corte.getMonth() - meses);
    const isoCorte = corte.toISOString();
    const a = this.stmts.limparAntigos.run(isoCorte).changes;
    const isoSemanaCorte = `${corte.getUTCFullYear() - 1}-W00`;
    const b = this.stmts.limparRowsSemCheckinAntigos.run(isoSemanaCorte).changes;
    return a + b;
  }
}
