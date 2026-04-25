import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import { appConfig, labelDoNivel } from "../config/appConfig";
import { config } from "../config";
import { mensagens } from "../mensagens";
import {
  type CheckinFilter,
  checkinRepo,
} from "../repositories";
import { isCanalOrientacao } from "../utils/canais";
import { executarExportacaoPorDM } from "./exportar";
import {
  descartarPendente,
  lerPendente,
  salvarPendente,
} from "./limparState";
import { log, maskId } from "../utils/log";
import { displayNameFromChannel, parseListaNomesCanais } from "../utils/validacao";
import { SlashCommand } from "./types";

export interface ResolucaoLimpar {
  filtro: CheckinFilter;
  filtroLabel: string;
}

export type ResolucaoLimparResult =
  | { ok: true; resolucao: ResolucaoLimpar }
  | { ok: false; mensagemErro: string };

export function resolverFiltroLimpar(
  interaction: ChatInputCommandInteraction,
): ResolucaoLimparResult {
  const escopo = interaction.options.getString("escopo", true);

  if (escopo === "tudo") {
    return {
      ok: true,
      resolucao: { filtro: { tipo: "tudo" }, filtroLabel: "tudo" },
    };
  }

  if (escopo === "canal") {
    const canalOpt = interaction.options.getChannel("canal", false);
    if (!canalOpt || !interaction.guild) {
      return { ok: false, mensagemErro: mensagens.get("cmd_erro_canal_invalido") };
    }
    const canal = interaction.guild.channels.cache.get(canalOpt.id);
    if (!canal || !isCanalOrientacao(canal)) {
      return { ok: false, mensagemErro: mensagens.get("cmd_erro_canal_invalido") };
    }
    const nome = displayNameFromChannel(canal.name, Object.keys(appConfig.prefixos));
    return {
      ok: true,
      resolucao: {
        filtro: { tipo: "canal", canalId: canal.id },
        filtroLabel: `canal: ${canal.name} (${nome})`,
      },
    };
  }

  if (escopo === "canais") {
    const lista = interaction.options.getString("lista", false);
    if (!lista) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", { escopo: "canais" }),
      };
    }
    const nomes = parseListaNomesCanais(lista);
    if (nomes.length === 0) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", { escopo: "canais" }),
      };
    }
    return {
      ok: true,
      resolucao: {
        filtro: { tipo: "canais", nomesCanais: nomes },
        filtroLabel: `canais: ${nomes.join(", ")}`,
      },
    };
  }

  if (escopo === "nivel") {
    const nivel = interaction.options.getString("nivel", false);
    if (!nivel || !appConfig.prefixos[nivel]) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", { escopo: "nivel" }),
      };
    }
    return {
      ok: true,
      resolucao: {
        filtro: { tipo: "nivel", nivel },
        filtroLabel: `nível: ${labelDoNivel(nivel)}`,
      },
    };
  }

  return {
    ok: false,
    mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", { escopo }),
  };
}

function botoesEscolhaInicial(id: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`limpar:exportar:${id}`)
      .setLabel("Exportar antes e limpar")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`limpar:semExportar:${id}`)
      .setLabel("Limpar sem exportar")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`limpar:cancelar:${id}`)
      .setLabel("Cancelar")
      .setStyle(ButtonStyle.Secondary),
  );
}

function botoesConfirmacaoFinal(id: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`limpar:confirmar:${id}`)
      .setLabel("Confirmar limpeza")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`limpar:cancelar:${id}`)
      .setLabel("Cancelar")
      .setStyle(ButtonStyle.Secondary),
  );
}

function adicionarOpcaoNivel(option: SlashCommandStringOption): SlashCommandStringOption {
  option
    .setName("nivel")
    .setDescription("Nível (quando escopo=nivel)")
    .setRequired(false);
  for (const [key, label] of Object.entries(appConfig.prefixos)) {
    option.addChoices({ name: label, value: key });
  }
  return option;
}

export const limparCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("limpar")
    .setDescription(
      "🐕 Remove registros de check-in do banco. Requer confirmação por botão.",
    )
    .addStringOption((option) =>
      option
        .setName("escopo")
        .setDescription("O que limpar")
        .setRequired(true)
        .addChoices(
          { name: "Tudo", value: "tudo" },
          { name: "Canal específico", value: "canal" },
          { name: "Múltiplos canais (lista)", value: "canais" },
          { name: "Nível", value: "nivel" },
        ),
    )
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal de orientação (quando escopo=canal)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addStringOption(adicionarOpcaoNivel)
    .addStringOption((option) =>
      option
        .setName("lista")
        .setDescription("Nomes de canais separados por vírgula (quando escopo=canais)")
        .setRequired(false),
    ),
  orientadorOnly: true,
  async execute(interaction) {
    log.info(
      `Comando /limpar disparado pelo orientador (${maskId(interaction.user.id)}).`,
    );

    const resultado = resolverFiltroLimpar(interaction);
    if (!resultado.ok) {
      await interaction.reply({
        content: resultado.mensagemErro,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const rows = checkinRepo.exportarRegistros(resultado.resolucao.filtro);
    if (rows.length === 0) {
      await interaction.reply({
        content: mensagens.get("cmd_limpar_sem_registros", {
          filtro: resultado.resolucao.filtroLabel,
        }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    salvarPendente(interaction.id, {
      filtro: resultado.resolucao.filtro,
      filtroLabel: resultado.resolucao.filtroLabel,
      total: rows.length,
    });

    await interaction.reply({
      content: mensagens.get("cmd_limpar_aviso", {
        total: String(rows.length),
        filtro: resultado.resolucao.filtroLabel,
      }),
      components: [botoesEscolhaInicial(interaction.id)],
      flags: MessageFlags.Ephemeral,
    });
  },
};

async function executarLimpeza(
  interaction: ButtonInteraction,
  pendenteId: string,
): Promise<void> {
  const pendente = lerPendente(pendenteId);
  if (!pendente) {
    await interaction.editReply({
      content: mensagens.get("cmd_limpar_expirado"),
      components: [],
    });
    return;
  }
  const removidos = checkinRepo.limparRegistros(pendente.filtro);
  descartarPendente(pendenteId);
  log.info(
    `Limpeza concluída: ${removidos} registro(s) removidos do filtro "${pendente.filtroLabel}" pelo orientador (${maskId(interaction.user.id)}).`,
  );
  await interaction.editReply({
    content: mensagens.get("cmd_limpar_sucesso", {
      total: String(removidos),
      filtro: pendente.filtroLabel,
    }),
    components: [],
  });
}

export async function onLimparButton(
  interaction: ButtonInteraction,
): Promise<void> {
  if (interaction.user.id !== config.orientadorId) {
    await interaction.reply({
      content: mensagens.get("cmd_botao_nao_autorizado"),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const parts = interaction.customId.split(":");
  const acao = parts[1];
  const pendenteId = parts[2];
  if (!acao || !pendenteId) return;

  const pendente = lerPendente(pendenteId);
  if (!pendente) {
    await interaction.update({
      content: mensagens.get("cmd_limpar_expirado"),
      components: [],
    });
    return;
  }

  if (acao === "cancelar") {
    descartarPendente(pendenteId);
    await interaction.update({
      content: mensagens.get("cmd_limpar_cancelado"),
      components: [],
    });
    return;
  }

  if (acao === "exportar") {
    await interaction.deferUpdate();
    const exportacao = await executarExportacaoPorDM(interaction.client, {
      filtro: pendente.filtro,
      filtroLabel: pendente.filtroLabel,
    });
    if (exportacao.status !== "sucesso") {
      descartarPendente(pendenteId);
      await interaction.editReply({
        content: `${exportacao.mensagem}\n\n${mensagens.get("cmd_limpar_cancelado")}`,
        components: [],
      });
      return;
    }
    await interaction.followUp({
      content: exportacao.mensagem,
      flags: MessageFlags.Ephemeral,
    });
    await executarLimpeza(interaction, pendenteId);
    return;
  }

  if (acao === "semExportar") {
    await interaction.update({
      content: mensagens.get("cmd_limpar_confirmacao_final", {
        total: String(pendente.total),
        filtro: pendente.filtroLabel,
      }),
      components: [botoesConfirmacaoFinal(pendenteId)],
    });
    return;
  }

  if (acao === "confirmar") {
    await interaction.deferUpdate();
    await executarLimpeza(interaction, pendenteId);
    return;
  }
}
