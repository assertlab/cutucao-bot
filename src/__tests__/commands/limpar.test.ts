import { ButtonInteraction } from "discord.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onLimparButton } from "../../commands/limpar";
import {
  limparTodosPendentes,
  salvarPendente,
} from "../../commands/limparState";
import { checkinRepo } from "../../repositories";

const ORIENTADOR_ID = "100000000000000002";
const OUTRO_USER = "999999999999999999";

const canalA = {
  canalId: "400000000000000001",
  nomeCanal: "msc-natasha-romanoff",
  nivel: "msc",
};
const canalB = {
  canalId: "400000000000000002",
  nomeCanal: "phd-jack-bauer",
  nivel: "phd",
};

function popular(): void {
  checkinRepo.registrarCheckin({
    ...canalA,
    semana: "2026-W17",
    dataCheckin: new Date("2026-04-21T10:00:00Z"),
  });
  checkinRepo.registrarLembrete({ ...canalB, semana: "2026-W17" });
}

beforeEach(() => {
  checkinRepo.limparRegistros({ tipo: "tudo" });
  limparTodosPendentes();
});

afterEach(() => {
  checkinRepo.limparRegistros({ tipo: "tudo" });
  limparTodosPendentes();
});

interface MockInteraction extends ButtonInteraction {
  update: ReturnType<typeof vi.fn>;
  deferUpdate: ReturnType<typeof vi.fn>;
  editReply: ReturnType<typeof vi.fn>;
  followUp: ReturnType<typeof vi.fn>;
  reply: ReturnType<typeof vi.fn>;
}

function mockButtonInteraction(
  customId: string,
  userId: string = ORIENTADOR_ID,
): MockInteraction {
  return {
    customId,
    user: { id: userId },
    update: vi.fn().mockResolvedValue(undefined),
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    client: {
      users: { fetch: vi.fn() },
    },
  } as unknown as MockInteraction;
}

describe("/limpar — confirmação obrigatória", () => {
  it("rejeita botão clicado por não-orientador sem deletar nada", async () => {
    popular();
    salvarPendente("pendente-1", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 2,
    });

    const interaction = mockButtonInteraction(
      "limpar:confirmar:pendente-1",
      OUTRO_USER,
    );
    await onLimparButton(interaction);

    expect(checkinRepo.contarRegistros()).toBe(2);
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("orientador"),
      }),
    );
  });

  it("não executa limpeza quando o pendente não existe (expirou ou nunca foi salvo)", async () => {
    popular();
    const interaction = mockButtonInteraction("limpar:confirmar:nao-existe");
    await onLimparButton(interaction);

    expect(checkinRepo.contarRegistros()).toBe(2);
    expect(interaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Tempo esgotado"),
        components: [],
      }),
    );
  });

  it("ao clicar 'Limpar sem exportar' exibe confirmação final mas NÃO deleta", async () => {
    popular();
    salvarPendente("pendente-2", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 2,
    });

    const interaction = mockButtonInteraction("limpar:semExportar:pendente-2");
    await onLimparButton(interaction);

    expect(checkinRepo.contarRegistros()).toBe(2);
    expect(interaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("Tem certeza?"),
        components: expect.any(Array),
      }),
    );
  });

  it("ao clicar 'Cancelar' descarta o pendente sem deletar", async () => {
    popular();
    salvarPendente("pendente-3", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 2,
    });

    const interaction = mockButtonInteraction("limpar:cancelar:pendente-3");
    await onLimparButton(interaction);

    expect(checkinRepo.contarRegistros()).toBe(2);
    expect(interaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("cancelada"),
        components: [],
      }),
    );
  });

  it("apenas o botão 'Confirmar limpeza' (após semExportar) executa a deleção", async () => {
    popular();
    salvarPendente("pendente-4", {
      filtro: { tipo: "tudo" },
      filtroLabel: "tudo",
      total: 2,
    });

    const interaction = mockButtonInteraction("limpar:confirmar:pendente-4");
    await onLimparButton(interaction);

    expect(checkinRepo.contarRegistros()).toBe(0);
    expect(interaction.deferUpdate).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("removidos"),
        components: [],
      }),
    );
  });

  it("aplica o filtro do pendente: nivel=msc remove só msc, mantém phd", async () => {
    popular();
    salvarPendente("pendente-5", {
      filtro: { tipo: "nivel", nivel: "msc" },
      filtroLabel: "nível: Mestrado",
      total: 1,
    });

    const interaction = mockButtonInteraction("limpar:confirmar:pendente-5");
    await onLimparButton(interaction);

    expect(checkinRepo.contarRegistros()).toBe(1);
    const restantes = checkinRepo.exportarRegistros({ tipo: "tudo" });
    expect(restantes[0]?.nivel).toBe("phd");
  });
});
