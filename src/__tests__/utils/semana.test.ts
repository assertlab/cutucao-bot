import { describe, expect, it } from "vitest";
import {
  currentIsoWeek,
  diffInWeeks,
  formatDateBr,
  formatWeekRange,
  isoWeekOfDate,
  isoWeekOffset,
} from "../../utils/semana";

describe("isoWeekOfDate", () => {
  it("computes week for a known Monday", () => {
    // April 20, 2026 is a Monday (start of week 17)
    expect(isoWeekOfDate(new Date("2026-04-20T00:00:00.000Z"))).toBe("2026-W17");
  });
  it("computes same week for the Sunday of that week", () => {
    // April 26, 2026 is Sunday of week 17
    expect(isoWeekOfDate(new Date("2026-04-26T00:00:00.000Z"))).toBe("2026-W17");
  });
  it("computes week 1 for Jan 5, 2026 (first Monday of 2026)", () => {
    expect(isoWeekOfDate(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-W02");
  });
  it("Jan 1, 2026 (Thursday) falls in week 1 of 2026", () => {
    expect(isoWeekOfDate(new Date("2026-01-01T00:00:00.000Z"))).toBe("2026-W01");
  });
});

describe("isoWeekOffset", () => {
  it("adds one week", () => {
    expect(isoWeekOffset("2026-W17", 1)).toBe("2026-W18");
  });
  it("subtracts one week", () => {
    expect(isoWeekOffset("2026-W17", -1)).toBe("2026-W16");
  });
  it("subtracts multiple weeks", () => {
    expect(isoWeekOffset("2026-W17", -4)).toBe("2026-W13");
  });
  it("crosses year boundary forward", () => {
    // 2026 starts on Thursday, so it has 53 weeks
    const result = isoWeekOffset("2026-W53", 1);
    expect(result).toBe("2027-W01");
  });
  it("crosses year boundary backward", () => {
    const result = isoWeekOffset("2026-W01", -1);
    // 2025 starts on Wednesday = 52 weeks
    expect(result).toBe("2025-W52");
  });
});

describe("diffInWeeks", () => {
  it("returns 0 for same week", () => {
    expect(diffInWeeks("2026-W17", "2026-W17")).toBe(0);
  });
  it("returns positive for later week", () => {
    expect(diffInWeeks("2026-W17", "2026-W20")).toBe(3);
  });
  it("returns negative for earlier week", () => {
    expect(diffInWeeks("2026-W20", "2026-W17")).toBe(-3);
  });
});

describe("formatWeekRange", () => {
  it("returns correct start and end for 2026-W17", () => {
    const { inicio, fim } = formatWeekRange("2026-W17");
    expect(inicio).toBe("20/04");
    expect(fim).toBe("26/04");
  });
  it("pads single-digit day and month", () => {
    // 2026-W01: Dec 29 2025 (Mon) to Jan 4 2026 (Sun)
    const { inicio, fim } = formatWeekRange("2026-W01");
    expect(inicio).toBe("29/12");
    expect(fim).toBe("04/01");
  });
});

describe("formatDateBr", () => {
  it("formats a date in Brazilian format", () => {
    const date = new Date("2026-04-20T12:00:00.000Z");
    expect(formatDateBr(date, "America/Recife")).toBe("20/04/2026");
  });
});

describe("currentIsoWeek", () => {
  it("returns the correct week for a given UTC time in Recife timezone", () => {
    // April 20, 2026 10:00 UTC = 07:00 Recife (UTC-3), same day
    const date = new Date("2026-04-20T10:00:00.000Z");
    expect(currentIsoWeek("America/Recife", date)).toBe("2026-W17");
  });
  it("uses local date for timezone conversion", () => {
    // April 20, 2026 02:00 UTC = April 19, 2026 23:00 Recife (UTC-3) — previous week
    const date = new Date("2026-04-20T02:00:00.000Z");
    expect(currentIsoWeek("America/Recife", date)).toBe("2026-W16");
  });
});
