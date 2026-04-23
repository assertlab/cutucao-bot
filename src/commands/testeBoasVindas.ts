import { ChannelType, MessageFlags, SlashCommandBuilder, TextChannel } from "discord.js";
import { config } from "../config";
import { mensagens } from "../mensagens";
import { mensagemBoasVindas } from "../utils/formatters";
import { log, maskId } from "../utils/log";
import { sanitizeDisplayName } from "../utils/validacao";
import { SlashCommand } from "./types";

export const testeBoasVindasCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("teste-boas-vindas")
    .setDescription("🐕 (Debug) Simula a mensagem de boas-vindas no canal #boas-vindas-e-regras."),
  orientadorOnly: true,
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    log.info(`Comando /teste-boas-vindas disparado pelo orientador (${maskId(interaction.user.id)}).`);

    const canal = interaction.guild?.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === config.canalBoasVindas,
    ) as TextChannel | undefined;

    if (!canal) {
      await interaction.editReply(
        mensagens.get("cmd_teste_boas_vindas_canal_nao_encontrado", {
          canal: config.canalBoasVindas,
        }),
      );
      return;
    }

    const member = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
    const nome = sanitizeDisplayName(member?.displayName ?? interaction.user.displayName);

    try {
      await canal.send({
        content: mensagemBoasVindas(nome),
        allowedMentions: { parse: [] },
      });
      await interaction.editReply(
        mensagens.get("cmd_teste_boas_vindas_sucesso", {
          canal_id: canal.id,
          nome,
        }),
      );
    } catch (err) {
      log.error("Falha ao executar /teste-boas-vindas.", err);
      await interaction.editReply(mensagens.get("cmd_teste_boas_vindas_erro"));
    }
  },
};
