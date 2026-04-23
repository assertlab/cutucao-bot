import { db } from "../database";
import { SQLiteCheckinRepository } from "./checkinRepository";

export { configRepo } from "./configRepository";
export type { IConfigRepository } from "./configRepository";
export type { ICheckinRepository, CheckinRow, Nivel } from "./checkinRepository";
export { SQLiteCheckinRepository } from "./checkinRepository";

export const checkinRepo = new SQLiteCheckinRepository(db);
