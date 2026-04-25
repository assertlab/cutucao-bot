import {
  AttachmentBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  type Client,
  DiscordAPIError,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from "discord.js";
import { Buffer } from "node:buffer";
import { appConfig, labelDoNivel } from "../config/appConfig";
import { config } from "../config";
import { mensagens } from "../mensagens";
import {
  type CheckinFilter,
  checkinRepo,
} from "../repositories";
import { isCanalOrientacao } from "../utils/canais";
import { formatBytes } from "../utils/formatBytes";
import {
  montarExportacao,
  nomeArquivoExportacao,
  semanaDeMesesAtras,
} from "../utils/exportacao";
import { log, maskId } from "../utils/log";
import { displayNameFromChannel } from "../utils/validacao";
import { SlashCommand } from "./types";

const LIMITE_DM_BYTES = 25 * 1024 * 1024;
const MESES_PADRAO = 6;

export interface ResolucaoFiltro {
  filtro: CheckinFilter;
  filtroLabel: string;
}

export interface ResolucaoSucesso {
  ok: true;
  resolucao: ResolucaoFiltro;
}

export interface ResolucaoErro {
  ok: false;
  mensagemErro: string;
}

export type ResolucaoFiltroResult = ResolucaoSucesso | ResolucaoErro;

export function resolverFiltroExportar(
  interaction: ChatInputCommandInteraction,
): ResolucaoFiltroResult {
  const escopo = interaction.options.getString("escopo", true);
  if (escopo === "tudo") {
    return { ok: true, resolucao: { filtro: { tipo: "tudo" }, filtroLabel: "tudo" } };
  }
  if (escopo === "canal") {
    const canalOpt = interaction.options.getChannel("canal", false);
    if (!canalOpt || !interaction.guild) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_erro_canal_invalido"),
      };
    }
    const canal = interaction.guild.channels.cache.get(canalOpt.id);
    if (!canal || !isCanalOrientacao(canal)) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_erro_canal_invalido"),
      };
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
  if (escopo === "nivel") {
    const nivel = interaction.options.getString("nivel", false);
    if (!nivel || !appConfig.prefixos[nivel]) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", {
          escopo: "nivel",
        }),
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
  if (escopo === "periodo") {
    const meses = interaction.options.getInteger("meses", false) ?? MESES_PADRAO;
    if (meses <= 0 || meses > 240) {
      return {
        ok: false,
        mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", {
          escopo: "periodo",
        }),
      };
    }
    const semanaInicio = semanaDeMesesAtras(meses, config.timezone);
    return {
      ok: true,
      resolucao: {
        filtro: { tipo: "periodo", semanaInicio },
        filtroLabel: `últimos ${meses} mês(es) (a partir de ${semanaInicio})`,
      },
    };
  }
  return {
    ok: false,
    mensagemErro: mensagens.get("cmd_limpar_filtro_invalido", { escopo }),
  };
}

export interface ResultadoExportacao {
  status: "sucesso" | "vazio" | "muito_grande" | "dm_bloqueada" | "erro";
  mensagem: string;
}

export async function executarExportacaoPorDM(
  client: Client,
  resolucao: ResolucaoFiltro,
): Promise<ResultadoExportacao> {
  const rows = checkinRepo.exportarRegistros(resolucao.filtro);

  if (rows.length === 0) {
    return {
      status: "vazio",
      mensagem: mensagens.get("cmd_exportar_sem_registros", {
        filtro: resolucao.filtroLabel,
      }),
    };
  }

  const json = montarExportacao({
    filtro: resolucao.filtro,
    filtroLabel: resolucao.filtroLabel,
    rows,
    repo: checkinRepo,
    timezone: config.timezone,
  });
  const buffer = Buffer.from(JSON.stringify(json, null, 2), "utf-8");
  const tamanho = formatBytes(buffer.byteLength);

  if (buffer.byteLength > LIMITE_DM_BYTES) {
    return {
      status: "muito_grande",
      mensagem: mensagens.get("cmd_exportar_arquivo_grande", { tamanho }),
    };
  }

  const arquivo = new AttachmentBuilder(buffer, {
    name: nomeArquivoExportacao(resolucao.filtroLabel),
  });

  try {
    const user = await client.users.fetch(config.orientadorId);
    await user.send({
      content: mensagens.get("cmd_exportar_dm_corpo", {
        filtro: resolucao.filtroLabel,
        registros: String(json.resumo.total_registros),
        taxa: json.resumo.taxa_adesao,
      }),
      files: [arquivo],
    });
  } catch (err) {
    if (err instanceof DiscordAPIError && err.code === 50007) {
      return {
        status: "dm_bloqueada",
        mensagem: mensagens.get("cmd_exportar_dm_falhou"),
      };
    }
    log.error("Falha ao enviar exportação por DM.", err);
    return {
      status: "erro",
      mensagem: mensagens.get("cmd_erro_generico"),
    };
  }

  return {
    status: "sucesso",
    mensagem: mensagens.get("cmd_exportar_sucesso", {
      registros: String(json.resumo.total_registros),
      tamanho,
      filtro: resolucao.filtroLabel,
    }),
  };
}

function adicionarOpcaoNivel(option: SlashCommandStringOption): SlashCommandStringOption {
  option.setName("nivel").setDescription("Nível (quando escopo=nivel)").setRequired(false);
  for (const [key, label] of Object.entries(appConfig.prefixos)) {
    option.addChoices({ name: label, value: key });
  }
  return option;
}

export const exportarCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("exportar")
    .setDescription(
      "🐕 Exporta registros de check-in em JSON (enviado por DM ao orientador).",
    )
    .addStringOption((option) =>
      option
        .setName("escopo")
        .setDescription("O que exportar")
        .setRequired(true)
        .addChoices(
          { name: "Tudo", value: "tudo" },
          { name: "Canal específico", value: "canal" },
          { name: "Nível", value: "nivel" },
          { name: "Período (últimos N meses)", value: "periodo" },
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
    .addIntegerOption((option) =>
      option
        .setName("meses")
        .setDescription("Quantos meses (quando escopo=periodo). Padrão: 6")
        .setMinValue(1)
        .setMaxValue(240)
        .setRequired(false),
    ),
  orientadorOnly: true,
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    log.info(
      `Comando /exportar disparado pelo orientador (${maskId(interaction.user.id)}).`,
    );

    const resultado = resolverFiltroExportar(interaction);
    if (!resultado.ok) {
      await interaction.editReply(resultado.mensagemErro);
      return;
    }
    const exportacao = await executarExportacaoPorDM(
      interaction.client,
      resultado.resolucao,
    );
    await interaction.editReply(exportacao.mensagem);
  },
};
