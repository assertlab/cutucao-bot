import Database from "better-sqlite3";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config";
import { log } from "./utils/log";
import { isoWeekOffset } from "./utils/semana";

export type Nivel = "phd" | "msc" | "bsc";

export interface CheckinRow {
  canalId: string;
  nomeCanal: string;
  nivel: Nivel;
  semana: string;
  checkinRealizado: 0 | 1;
  dataCheckin: string | null;
}

mkdirSync(dirname(config.databasePath), { recursive: true });

const db = new Database(config.databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

try {
  chmodSync(config.databasePath, 0o600);
} catch (err) {
  log.warn("Não foi possível aplicar chmod 600 no arquivo do banco.", {
    erro: err instanceof Error ? err.message : String(err),
  });
}

db.exec(`
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
`);

const stmts = {
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

export function registrarLembrete(input: {
  canalId: string;
  nomeCanal: string;
  nivel: Nivel;
  semana: string;
}): void {
  stmts.upsertLembrete.run(input);
}

export function registrarCheckin(input: {
  canalId: string;
  nomeCanal: string;
  nivel: Nivel;
  semana: string;
  dataCheckin: Date;
}): { novo: boolean } {
  const existente = stmts.getRow.get(input.canalId, input.semana) as
    | CheckinRow
    | undefined;
  if (existente?.checkinRealizado === 1) {
    return { novo: false };
  }
  stmts.registrarCheckin.run({
    ...input,
    dataCheckin: input.dataCheckin.toISOString(),
  });
  return { novo: true };
}

export function listarStatusSemana(semana: string): CheckinRow[] {
  return stmts.canaisDaSemana.all(semana) as CheckinRow[];
}

export function semanasConsecutivasSemCheckin(
  canalId: string,
  semanaAtual: string,
): number {
  const linhas = stmts.historicoCanal.all(canalId) as Array<{
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

export function listarHistoricoCanal(
  canalId: string,
): Array<{ semana: string; checkinRealizado: 0 | 1 }> {
  return stmts.historicoCanal.all(canalId) as Array<{
    semana: string;
    checkinRealizado: 0 | 1;
  }>;
}

export function limparHistoricoAntigo(meses: number): number {
  const corte = new Date();
  corte.setMonth(corte.getMonth() - meses);
  const isoCorte = corte.toISOString();
  const a = stmts.limparAntigos.run(isoCorte).changes;
  const isoSemanaCorte = `${corte.getUTCFullYear() - 1}-W00`;
  const b = stmts.limparRowsSemCheckinAntigos.run(isoSemanaCorte).changes;
  return a + b;
}

export function closeDatabase(): void {
  db.close();
}

export { db };
