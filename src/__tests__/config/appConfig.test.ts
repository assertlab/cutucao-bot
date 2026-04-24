import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { loadAppConfig } from "../../config/appConfig";

const tmpPath = join(tmpdir(), `cutucao-test-config-${process.pid}.json`);

afterEach(() => {
  if (existsSync(tmpPath)) unlinkSync(tmpPath);
});

describe("loadAppConfig — sem arquivo", () => {
  it("usa valores padrão quando config.json não existe", () => {
    const cfg = loadAppConfig("/caminho/que/nao/existe.json");
    expect(cfg.categorias).toEqual(["Orientações"]);
    expect(cfg.prefixos).toEqual({ phd: "Doutorado", msc: "Mestrado", bsc: "Graduação" });
    expect(cfg.canal_boas_vindas).toBe("boas-vindas-e-regras");
    expect(cfg.horarios.lembrete).toBe("0 9 * * 1");
    expect(cfg.escalacao.semanas_para_cobranca_dm).toBe(2);
    expect(cfg.escalacao.semanas_para_alerta).toBe(3);
    expect(cfg.visualizacao.semanas_historico_padrao).toBe(4);
    expect(cfg.visualizacao.meses_resumo_padrao).toBe(6);
  });
});

describe("loadAppConfig — arquivo válido", () => {
  it("mescla config parcial com defaults", () => {
    writeFileSync(tmpPath, JSON.stringify({ categorias: ["Orientações", "Pesquisa"] }));
    const cfg = loadAppConfig(tmpPath);
    expect(cfg.categorias).toEqual(["Orientações", "Pesquisa"]);
    expect(cfg.prefixos).toEqual({ phd: "Doutorado", msc: "Mestrado", bsc: "Graduação" });
  });

  it("substitui horários individualmente com defaults para os ausentes", () => {
    writeFileSync(tmpPath, JSON.stringify({ horarios: { lembrete: "0 8 * * 1" } }));
    const cfg = loadAppConfig(tmpPath);
    expect(cfg.horarios.lembrete).toBe("0 8 * * 1");
    expect(cfg.horarios.cobranca).toBe("0 9 * * 3");
    expect(cfg.horarios.resumo).toBe("0 18 * * 5");
  });

  it("aceita prefixos customizados", () => {
    writeFileSync(
      tmpPath,
      JSON.stringify({
        prefixos: { phd: "Doutorado", msc: "Mestrado", bsc: "Graduação", pos: "Pós-doc" },
      }),
    );
    const cfg = loadAppConfig(tmpPath);
    expect(cfg.prefixos["pos"]).toBe("Pós-doc");
    expect(Object.keys(cfg.prefixos)).toHaveLength(4);
  });

  it("aceita múltiplas categorias", () => {
    writeFileSync(
      tmpPath,
      JSON.stringify({ categorias: ["Orientações", "Colaboradores externos"] }),
    );
    const cfg = loadAppConfig(tmpPath);
    expect(cfg.categorias).toHaveLength(2);
    expect(cfg.categorias).toContain("Colaboradores externos");
  });

  it("substitui escalacao individualmente", () => {
    writeFileSync(tmpPath, JSON.stringify({ escalacao: { semanas_para_cobranca_dm: 3 } }));
    const cfg = loadAppConfig(tmpPath);
    expect(cfg.escalacao.semanas_para_cobranca_dm).toBe(3);
    expect(cfg.escalacao.semanas_para_alerta).toBe(3);
  });

  it("ignora campos prefixados com _", () => {
    writeFileSync(
      tmpPath,
      JSON.stringify({ _info: "Arquivo de referência", categorias: ["Orientações"] }),
    );
    const cfg = loadAppConfig(tmpPath);
    expect(cfg.categorias).toEqual(["Orientações"]);
  });
});

describe("loadAppConfig — validação", () => {
  it("lança erro quando categorias é vazio", () => {
    writeFileSync(tmpPath, JSON.stringify({ categorias: [] }));
    expect(() => loadAppConfig(tmpPath)).toThrow(/categorias/);
  });

  it("lança erro quando prefixos é vazio", () => {
    writeFileSync(tmpPath, JSON.stringify({ prefixos: {} }));
    expect(() => loadAppConfig(tmpPath)).toThrow(/prefixos/);
  });

  it("lança erro para cron expression inválida em lembrete", () => {
    writeFileSync(
      tmpPath,
      JSON.stringify({ horarios: { lembrete: "nao-e-cron", cobranca: "0 9 * * 3", resumo: "0 18 * * 5" } }),
    );
    expect(() => loadAppConfig(tmpPath)).toThrow(/cron/);
  });

  it("lança erro para cron expression inválida em resumo", () => {
    writeFileSync(
      tmpPath,
      JSON.stringify({ horarios: { lembrete: "0 9 * * 1", cobranca: "0 9 * * 3", resumo: "not-valid-cron" } }),
    );
    expect(() => loadAppConfig(tmpPath)).toThrow(/horarios\.resumo/);
  });

  it("lança erro para JSON malformado", () => {
    writeFileSync(tmpPath, "isso nao e json {");
    expect(() => loadAppConfig(tmpPath)).toThrow(/Falha ao ler/);
  });

  it("lança erro se raiz não é objeto", () => {
    writeFileSync(tmpPath, "[1, 2, 3]");
    expect(() => loadAppConfig(tmpPath)).toThrow(/Falha ao ler/);
  });
});
