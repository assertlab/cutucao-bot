import Database from "better-sqlite3";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config";
import { log } from "./utils/log";

mkdirSync(dirname(config.databasePath), { recursive: true });

export const db = new Database(config.databasePath);

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

export function closeDatabase(): void {
  db.close();
}
