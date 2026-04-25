import { describe, expect, it } from "vitest";
import { formatBytes } from "../../utils/formatBytes";

describe("formatBytes", () => {
  it("returns bytes for values under 1024", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("returns KB with one decimal between 1 KB and 1 MB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(1024 * 1023)).toBe("1023.0 KB");
  });

  it("returns MB with two decimals at and above 1 MB", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(25 * 1024 * 1024)).toBe("25.00 MB");
  });
});
