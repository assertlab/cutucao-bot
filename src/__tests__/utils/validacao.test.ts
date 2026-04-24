import { describe, expect, it } from "vitest";
import {
  displayNameFromChannel,
  isOrientacaoChannelName,
  isValidCron,
  isValidDiscordId,
  nivelFromChannelName,
  sanitizeDisplayName,
} from "../../utils/validacao";

describe("isValidDiscordId", () => {
  it("accepts 18-digit IDs", () => {
    expect(isValidDiscordId("123456789012345678")).toBe(true);
  });
  it("accepts 17-digit IDs", () => {
    expect(isValidDiscordId("12345678901234567")).toBe(true);
  });
  it("accepts 20-digit IDs", () => {
    expect(isValidDiscordId("12345678901234567890")).toBe(true);
  });
  it("rejects IDs shorter than 17 digits", () => {
    expect(isValidDiscordId("1234567890123456")).toBe(false);
  });
  it("rejects IDs longer than 20 digits", () => {
    expect(isValidDiscordId("123456789012345678901")).toBe(false);
  });
  it("rejects non-numeric IDs", () => {
    expect(isValidDiscordId("12345678901234567a")).toBe(false);
  });
  it("rejects empty string", () => {
    expect(isValidDiscordId("")).toBe(false);
  });
});

describe("isValidCron", () => {
  it("accepts valid Monday 09:00 expression", () => {
    expect(isValidCron("0 9 * * 1")).toBe(true);
  });
  it("accepts valid Wednesday 09:00 expression", () => {
    expect(isValidCron("0 9 * * 3")).toBe(true);
  });
  it("accepts valid Friday 18:00 expression", () => {
    expect(isValidCron("0 18 * * 5")).toBe(true);
  });
  it("rejects wildcard-only expression", () => {
    expect(isValidCron("* * * * *")).toBe(false);
  });
  it("rejects expression with day-of-month set", () => {
    expect(isValidCron("0 9 1 * 1")).toBe(false);
  });
  it("rejects expression with month set", () => {
    expect(isValidCron("0 9 * 6 1")).toBe(false);
  });
});

describe("isOrientacaoChannelName — prefixos padrão", () => {
  it("accepts phd- prefixed names", () => {
    expect(isOrientacaoChannelName("phd-joao-silva")).toBe(true);
  });
  it("accepts msc- prefixed names", () => {
    expect(isOrientacaoChannelName("msc-alana-fernandes")).toBe(true);
  });
  it("accepts bsc- prefixed names", () => {
    expect(isOrientacaoChannelName("bsc-daniel-oliveira")).toBe(true);
  });
  it("rejects names without prefix", () => {
    expect(isOrientacaoChannelName("geral")).toBe(false);
  });
  it("rejects names with uppercase letters", () => {
    expect(isOrientacaoChannelName("MSC-alana")).toBe(false);
  });
  it("rejects unknown prefix", () => {
    expect(isOrientacaoChannelName("dr-joao")).toBe(false);
  });
});

describe("isOrientacaoChannelName — prefixos customizados", () => {
  it("accepts custom prefix when provided", () => {
    expect(isOrientacaoChannelName("pos-joao-silva", ["pos", "phd"])).toBe(true);
  });
  it("rejects default phd when not in custom list", () => {
    expect(isOrientacaoChannelName("phd-joao-silva", ["pos"])).toBe(false);
  });
  it("returns false for empty prefixes array", () => {
    expect(isOrientacaoChannelName("phd-joao-silva", [])).toBe(false);
  });
});

describe("nivelFromChannelName — prefixos padrão", () => {
  it("extracts phd", () => {
    expect(nivelFromChannelName("phd-joao-silva")).toBe("phd");
  });
  it("extracts msc", () => {
    expect(nivelFromChannelName("msc-alana")).toBe("msc");
  });
  it("extracts bsc", () => {
    expect(nivelFromChannelName("bsc-daniel")).toBe("bsc");
  });
  it("returns null for unrecognized prefix", () => {
    expect(nivelFromChannelName("geral")).toBeNull();
  });
});

describe("nivelFromChannelName — prefixos customizados", () => {
  it("extracts custom prefix", () => {
    expect(nivelFromChannelName("pos-joao-silva", ["pos", "phd"])).toBe("pos");
  });
  it("returns null when prefix not in custom list", () => {
    expect(nivelFromChannelName("phd-joao", ["pos"])).toBeNull();
  });
});

describe("sanitizeDisplayName", () => {
  it("removes markdown characters", () => {
    expect(sanitizeDisplayName("**bold**")).toBe("bold");
  });
  it("removes @ mentions", () => {
    expect(sanitizeDisplayName("@everyone")).toBe("everyone");
  });
  it("removes backticks", () => {
    expect(sanitizeDisplayName("`code`")).toBe("code");
  });
  it("truncates to 80 characters", () => {
    const long = "a".repeat(100);
    expect(sanitizeDisplayName(long)).toHaveLength(80);
  });
  it("passes through clean names unchanged", () => {
    expect(sanitizeDisplayName("Alana Fernandes")).toBe("Alana Fernandes");
  });
});

describe("displayNameFromChannel — prefixos padrão", () => {
  it("converts msc-alana-fernandes to Alana Fernandes", () => {
    expect(displayNameFromChannel("msc-alana-fernandes")).toBe("Alana Fernandes");
  });
  it("converts phd-joao-silva to Joao Silva", () => {
    expect(displayNameFromChannel("phd-joao-silva")).toBe("Joao Silva");
  });
  it("converts bsc-daniel to Daniel", () => {
    expect(displayNameFromChannel("bsc-daniel")).toBe("Daniel");
  });
  it("strips markdown from output", () => {
    expect(displayNameFromChannel("msc-user-name")).not.toContain("-");
  });
});

describe("displayNameFromChannel — prefixos customizados", () => {
  it("strips custom prefix from channel name", () => {
    expect(displayNameFromChannel("pos-joao-silva", ["pos"])).toBe("Joao Silva");
  });
  it("uses default prefixes when none passed", () => {
    expect(displayNameFromChannel("phd-maria")).toBe("Maria");
  });
});
