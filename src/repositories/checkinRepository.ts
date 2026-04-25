import Database from "better-sqlite3";
import { isoWeekOffset } from "../utils/semana";

export type Nivel = string;

export interface CheckinRow {
  canalId: string;
  nomeCanal: string;
  nivel: Nivel;
  semana: string;
  checkinRealizado: 0 | 1;
  dataCheckin: string | null;
}

export type CheckinFilter =
  | { tipo: "tudo" }
  | { tipo: "canal"; canalId: string }
  | { tipo: "canais"; nomesCanais: string[] }
  | { tipo: "nivel"; nivel: string }
  | { tipo: "periodo"; semanaInicio: string };

export interface ContagemPorNivel {
  nivel: string;
  total: number;
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
  contarRegistros(): number;
  contarCanaisMonitorados(): number;
  contarRegistrosPorNivel(): ContagemPorNivel[];
  registroMaisAntigo(): string | null;
  registroMaisRecente(): string | null;
  exportarRegistros(filtro: CheckinFilter): CheckinRow[];
  limparRegistros(filtro: CheckinFilter): number;
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS checkins (
    canalId TEXT NOT NULL,
    nomeCanal TEXT NOT NULL,
    nivel TEXT NOT NULL,
    semana TEXT NOT NULL,
    checkinRealizado INTEGER NOT NULL DEFAULT 0 CHECK (checkinRealizado IN (0, 1)),
    dataCheckin TEXT,
    PRIMARY KEY (canalId, semana)
  );
  CREATE INDEX IF NOT EXISTS idx_checkins_semana ON checkins(semana);
  CREATE INDEX IF NOT EXISTS idx_checkins_canal ON checkins(canalId);
  CREATE INDEX IF NOT EXISTS idx_checkins_nivel ON checkins(nivel);
`;

export class SQLiteCheckinRepository implements ICheckinRepository {
  private readonly stmts: {
    upsertLembrete: Database.Statement;
    registrarCheckin: Database.Statement;
    getRow: Database.Statement;
    canaisDaSemana: Database.Statement;
    historicoCanal: Database.Statement;
    contarTotal: Database.Statement;
    contarCanais: Database.Statement;
    contarPorNivel: Database.Statement;
    semanaMaisAntiga: Database.Statement;
    semanaMaisRecente: Database.Statement;
    listarTudo: Database.Statement;
    listarPorCanal: Database.Statement;
    listarPorNivel: Database.Statement;
    listarPorPeriodo: Database.Statement;
    limparTudo: Database.Statement;
    limparPorCanal: Database.Statement;
    limparPorNivel: Database.Statement;
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
      contarTotal: db.prepare(`SELECT COUNT(*) AS total FROM checkins`),
      contarCanais: db.prepare(
        `SELECT COUNT(DISTINCT canalId) AS total FROM checkins`,
      ),
      contarPorNivel: db.prepare(`
        SELECT nivel, COUNT(*) AS total
        FROM checkins
        GROUP BY nivel
        ORDER BY nivel
      `),
      semanaMaisAntiga: db.prepare(
        `SELECT MIN(semana) AS semana FROM checkins`,
      ),
      semanaMaisRecente: db.prepare(
        `SELECT MAX(semana) AS semana FROM checkins`,
      ),
      listarTudo: db.prepare(`
        SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
        FROM checkins
        ORDER BY semana, nomeCanal
      `),
      listarPorCanal: db.prepare(`
        SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
        FROM checkins
        WHERE canalId = ?
        ORDER BY semana
      `),
      listarPorNivel: db.prepare(`
        SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
        FROM checkins
        WHERE nivel = ?
        ORDER BY semana, nomeCanal
      `),
      listarPorPeriodo: db.prepare(`
        SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
        FROM checkins
        WHERE semana >= ?
        ORDER BY semana, nomeCanal
      `),
      limparTudo: db.prepare(`DELETE FROM checkins`),
      limparPorCanal: db.prepare(`DELETE FROM checkins WHERE canalId = ?`),
      limparPorNivel: db.prepare(`DELETE FROM checkins WHERE nivel = ?`),
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

  contarRegistros(): number {
    const row = this.stmts.contarTotal.get() as { total: number };
    return row.total;
  }

  contarCanaisMonitorados(): number {
    const row = this.stmts.contarCanais.get() as { total: number };
    return row.total;
  }

  contarRegistrosPorNivel(): ContagemPorNivel[] {
    return this.stmts.contarPorNivel.all() as ContagemPorNivel[];
  }

  registroMaisAntigo(): string | null {
    const row = this.stmts.semanaMaisAntiga.get() as { semana: string | null };
    return row.semana;
  }

  registroMaisRecente(): string | null {
    const row = this.stmts.semanaMaisRecente.get() as { semana: string | null };
    return row.semana;
  }

  exportarRegistros(filtro: CheckinFilter): CheckinRow[] {
    switch (filtro.tipo) {
      case "tudo":
        return this.stmts.listarTudo.all() as CheckinRow[];
      case "canal":
        return this.stmts.listarPorCanal.all(filtro.canalId) as CheckinRow[];
      case "canais": {
        if (filtro.nomesCanais.length === 0) return [];
        const placeholders = filtro.nomesCanais.map(() => "?").join(",");
        const stmt = this.db.prepare(`
          SELECT canalId, nomeCanal, nivel, semana, checkinRealizado, dataCheckin
          FROM checkins
          WHERE nomeCanal IN (${placeholders})
          ORDER BY semana, nomeCanal
        `);
        return stmt.all(...filtro.nomesCanais) as CheckinRow[];
      }
      case "nivel":
        return this.stmts.listarPorNivel.all(filtro.nivel) as CheckinRow[];
      case "periodo":
        return this.stmts.listarPorPeriodo.all(
          filtro.semanaInicio,
        ) as CheckinRow[];
    }
  }

  limparRegistros(filtro: CheckinFilter): number {
    switch (filtro.tipo) {
      case "tudo":
        return this.stmts.limparTudo.run().changes;
      case "canal":
        return this.stmts.limparPorCanal.run(filtro.canalId).changes;
      case "canais": {
        if (filtro.nomesCanais.length === 0) return 0;
        const placeholders = filtro.nomesCanais.map(() => "?").join(",");
        const stmt = this.db.prepare(
          `DELETE FROM checkins WHERE nomeCanal IN (${placeholders})`,
        );
        return stmt.run(...filtro.nomesCanais).changes;
      }
      case "nivel":
        return this.stmts.limparPorNivel.run(filtro.nivel).changes;
      case "periodo":
        return this.db
          .prepare(`DELETE FROM checkins WHERE semana >= ?`)
          .run(filtro.semanaInicio).changes;
    }
  }
}
