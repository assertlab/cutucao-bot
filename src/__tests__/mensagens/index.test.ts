import { describe, expect, it } from "vitest";
import { MensagemService, type Templates } from "../../mensagens/index";

const fixtures: Templates = {
  simples: {
    categoria: "lembrete",
    descricao: "Template sem placeholders",
    texto: "Mensagem simples.",
  },
  com_placeholder: {
    categoria: "boas-vindas",
    descricao: "Template com placeholder",
    texto: "Olá, {{nome}}! Bem-vindo(a).",
  },
  multiplos: {
    categoria: "resumo",
    descricao: "Template com múltiplos placeholders",
    texto: "Semana {{inicio}} a {{fim}}: {{total}} alunos.",
  },
  repetido: {
    categoria: "comando",
    descricao: "Template com placeholder repetido",
    texto: "{{item}} e {{item}} de novo.",
  },
};

const svc = new MensagemService(fixtures);

describe("MensagemService.get", () => {
  it("returns plain text when no placeholders", () => {
    expect(svc.get("simples")).toBe("Mensagem simples.");
  });

  it("resolves a single placeholder", () => {
    expect(svc.get("com_placeholder", { nome: "Alana" })).toBe(
      "Olá, Alana! Bem-vindo(a).",
    );
  });

  it("resolves multiple placeholders", () => {
    expect(svc.get("multiplos", { inicio: "20/04", fim: "26/04", total: "5" })).toBe(
      "Semana 20/04 a 26/04: 5 alunos.",
    );
  });

  it("resolves repeated placeholders", () => {
    expect(svc.get("repetido", { item: "X" })).toBe("X e X de novo.");
  });

  it("leaves unreferenced placeholders as-is", () => {
    expect(svc.get("com_placeholder", { outro: "valor" })).toBe(
      "Olá, {{nome}}! Bem-vindo(a).",
    );
  });

  it("throws for unknown template IDs", () => {
    expect(() => svc.get("nao_existe")).toThrow(/nao_existe/);
  });
});

describe("MensagemService.getTemplate", () => {
  it("returns the template object for a known ID", () => {
    const t = svc.getTemplate("simples");
    expect(t).toBeDefined();
    expect(t?.categoria).toBe("lembrete");
  });

  it("returns undefined for unknown IDs", () => {
    expect(svc.getTemplate("nao_existe")).toBeUndefined();
  });
});

describe("MensagemService.listAll", () => {
  it("returns all templates", () => {
    const all = svc.listAll();
    expect(all.size).toBe(Object.keys(fixtures).length);
  });
});

describe("MensagemService with default templates (templates.json)", () => {
  const defaultSvc = new MensagemService();

  it("loads lembrete_semanal", () => {
    const msg = defaultSvc.get("lembrete_semanal", {
      data: "21/04/2026",
      saudacao: "",
    });
    expect(msg).toContain("21/04/2026");
    expect(msg).toContain("check-in");
  });

  it("loads boas_vindas and resolves nome", () => {
    const msg = defaultSvc.get("boas_vindas", { nome: "Fagner" });
    expect(msg).toContain("Fagner");
  });

  it("loads cobranca_gentil without placeholders", () => {
    const msg = defaultSvc.get("cobranca_gentil");
    expect(msg.length).toBeGreaterThan(10);
  });
});
