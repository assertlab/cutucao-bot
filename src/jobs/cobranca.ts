import { Client } from "discord.js";
import { appConfig } from "../config/appConfig";
import { config } from "../config";
import { checkinRepo } from "../repositories";
import { listarCanaisOrientacao } from "../utils/canais";
import {
  LinhaResumo,
  mensagemAlertaInativos,
  mensagemCobranca,
} from "../utils/formatters";
import { log, maskChannelName, maskId } from "../utils/log";
import { CircuitBreaker, forEachComRateLimit } from "../utils/rateLimit";
import { currentIsoWeek } from "../utils/semana";

const breaker = new CircuitBreaker("cobranca");

export async function jobCobranca(client: Client<true>): Promise<void> {
  if (breaker.estaAberto()) {
    log.warn("Job cobranca pulado — circuit breaker aberto.");
    return;
  }

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    log.error("Guild configurado não encontrado ao executar cobranca.");
    breaker.registrarFalha();
    return;
  }

  const canais = listarCanaisOrientacao(guild);
  const semana = currentIsoWeek(config.timezone);

  for (const { canal, nivel } of canais) {
    checkinRepo.registrarLembrete({ canalId: canal.id, nomeCanal: canal.name, nivel, semana });
  }

  const status = checkinRepo.listarStatusSemana(semana);
  const semCheckinIds = new Set(
    status.filter((row) => row.checkinRealizado === 0).map((row) => row.canalId),
  );

  const alvos = canais.filter(({ canal }) => semCheckinIds.has(canal.id));

  const enviados = await forEachComRateLimit(
    alvos,
    {
      limite: config.limites.mensagensPorCiclo,
      cooldownMs: config.limites.cooldownMs,
      rotulo: "cobranca",
    },
    async ({ canal }) => {
      await canal.send({
        content: mensagemCobranca(),
        allowedMentions: { parse: [] },
      });
      log.info(`Cobrança enviada em ${maskChannelName(canal.name)}.`);
    },
  );

  log.info(`Cobranças enviadas para ${enviados}/${alvos.length} canais sem check-in.`);

  const inativos: LinhaResumo[] = [];
  for (const { canal, nivel } of alvos) {
    const semanas = checkinRepo.semanasConsecutivasSemCheckin(canal.id, semana);
    if (semanas >= appConfig.escalacao.semanas_para_cobranca_dm) {
      inativos.push({
        nomeCanal: canal.name,
        nivel,
        semanasSemCheckin: semanas,
      });
    }
  }

  if (inativos.length > 0) {
    await avisarOrientador(client, inativos);
  }

  breaker.registrarSucesso();
}

async function avisarOrientador(
  client: Client<true>,
  inativos: LinhaResumo[],
): Promise<void> {
  try {
    const orientador = await client.users.fetch(config.orientadorId);
    await orientador.send({
      content: mensagemAlertaInativos(inativos),
      allowedMentions: { parse: [] },
    });
    log.info(
      `DM de alerta enviada ao orientador (${maskId(config.orientadorId)}) com ${inativos.length} inativo(s).`,
    );
  } catch (err) {
    log.error("Falha ao enviar DM de alerta ao orientador.", err);
  }
}
