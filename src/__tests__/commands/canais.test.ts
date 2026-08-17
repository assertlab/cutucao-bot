import { ChannelType, ChatInputCommandInteraction, Guild } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { canaisCommand, montarConteudoCanais } from "../../commands/canais";

const CATEGORIA_ID = "500000000000000001";
const OUTRA_CATEGORIA_ID = "500000000000000002";

interface CanalMock {
  id: string;
  name: string;
  type: ChannelType;
  parentId: string | null;
  parent?: CanalMock;
}

function criarCategoria(id: string, name: string): CanalMock {
  return { id, name, type: ChannelType.GuildCategory, parentId: null };
}

function criarCanalTexto(id: string, name: string, categoria: CanalMock): CanalMock {
  return {
    id,
    name,
    type: ChannelType.GuildText,
    parentId: categoria.id,
    parent: categoria,
  };
}

function criarGuild(canais: CanalMock[]): Guild {
  const cache = new Map(canais.map((c) => [c.id, c]));
  return { channels: { cache } } as unknown as Guild;
}

describe("montarConteudoCanais", () => {
  it("agrupa canais por categoria e nível, ordenados alfabeticamente, com totais", () => {
    const orientacoes = criarCategoria(CATEGORIA_ID, "Orientações");
    const guild = criarGuild([
      orientacoes,
      criarCanalTexto("1", "phd-saulo-aguiar", orientacoes),
      criarCanalTexto("2", "phd-fagner-fernandes", orientacoes),
      criarCanalTexto("3", "msc-david-jorge", orientacoes),
      criarCanalTexto("4", "msc-anderson-marinho", orientacoes),
      criarCanalTexto("5", "bsc-daniel-oliveira", orientacoes),
    ]);

    const conteudo = montarConteudoCanais(guild);

    expect(conteudo).toContain("🐕 **Canais monitorados (5)**");
    expect(conteudo).toContain("📁 **Orientações**");
    expect(conteudo).toContain("**Doutorado (2):**");
    expect(conteudo).toContain("**Mestrado (2):**");
    expect(conteudo).toContain("**Graduação (1):**");

    const idxFagner = conteudo.indexOf("#phd-fagner-fernandes");
    const idxSaulo = conteudo.indexOf("#phd-saulo-aguiar");
    expect(idxFagner).toBeGreaterThan(-1);
    expect(idxSaulo).toBeGreaterThan(idxFagner);

    const idxAnderson = conteudo.indexOf("#msc-anderson-marinho");
    const idxDavid = conteudo.indexOf("#msc-david-jorge");
    expect(idxAnderson).toBeGreaterThan(-1);
    expect(idxDavid).toBeGreaterThan(idxAnderson);
  });

  it("ignora canais fora das categorias monitoradas", () => {
    const orientacoes = criarCategoria(CATEGORIA_ID, "Orientações");
    const outraCategoria = criarCategoria(OUTRA_CATEGORIA_ID, "Geral");
    const guild = criarGuild([
      orientacoes,
      outraCategoria,
      criarCanalTexto("1", "phd-fagner-fernandes", orientacoes),
      criarCanalTexto("2", "msc-alguem-fora", outraCategoria),
    ]);

    const conteudo = montarConteudoCanais(guild);

    expect(conteudo).toContain("🐕 **Canais monitorados (1)**");
    expect(conteudo).toContain("#phd-fagner-fernandes");
    expect(conteudo).not.toContain("msc-alguem-fora");
  });

  it("ignora canais que não seguem o padrão de prefixo de nível", () => {
    const orientacoes = criarCategoria(CATEGORIA_ID, "Orientações");
    const guild = criarGuild([
      orientacoes,
      criarCanalTexto("1", "phd-fagner-fernandes", orientacoes),
      criarCanalTexto("2", "geral-avisos", orientacoes),
    ]);

    const conteudo = montarConteudoCanais(guild);

    expect(conteudo).toContain("🐕 **Canais monitorados (1)**");
    expect(conteudo).not.toContain("geral-avisos");
  });

  it("retorna mensagem de vazio quando nenhum canal monitorado é encontrado", () => {
    const guild = criarGuild([]);

    const conteudo = montarConteudoCanais(guild);

    expect(conteudo).toContain("Nenhum canal monitorado encontrado");
  });
});

describe("/canais — comando", () => {
  function mockInteraction(guild: Guild | null): ChatInputCommandInteraction {
    return {
      guild,
      reply: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChatInputCommandInteraction;
  }

  it("é restrito ao orientador", () => {
    expect(canaisCommand.orientadorOnly).toBe(true);
  });

  it("responde de forma ephemeral com a lista de canais", async () => {
    const orientacoes = criarCategoria(CATEGORIA_ID, "Orientações");
    const guild = criarGuild([orientacoes, criarCanalTexto("1", "phd-fagner-fernandes", orientacoes)]);
    const interaction = mockInteraction(guild);

    await canaisCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Canais monitorados"),
        flags: expect.anything(),
      }),
    );
  });

  it("responde com erro quando executado fora de um servidor", async () => {
    const interaction = mockInteraction(null);

    await canaisCommand.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("servidor"),
      }),
    );
  });
});
