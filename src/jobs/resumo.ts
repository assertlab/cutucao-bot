import { Client } from "discord.js";
import { config } from "../config";
import {
  listarStatusSemana,
  registrarLembrete,
  semanasConsecutivasSemCheckin,
} from "../database";
import { listarCanaisOrientacao } from "../utils/canais";
import { LinhaResumo, mensagemResumoSemanal } from "../utils/formatters";
import { log, maskId } from "../utils/log";
import { CircuitBreaker } from "../utils/rateLimit";
import { currentIsoWeek } from "../utils/semana";

const breaker = new CircuitBreaker("resumo");

export async function jobResumo(client: Client<true>): Promise<void> {
  if (breaker.estaAberto()) {
    log.warn("Job resumo pulado — circuit breaker aberto.");
    return;
  }

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    log.error("Guild configurado não encontrado ao executar resumo.");
    breaker.registrarFalha();
    return;
  }

  const canais = listarCanaisOrientacao(guild);
  const semana = currentIsoWeek(config.timezone);

  for (const { canal, nivel } of canais) {
    registrarLembrete({ canalId: canal.id, nomeCanal: canal.name, nivel, semana });
  }

  const status = listarStatusSemana(semana);
  const statusPorCanal = new Map(status.map((row) => [row.canalId, row]));

  const postaram: LinhaResumo[] = [];
  const naoPostaram: LinhaResumo[] = [];

  for (const { canal, nivel } of canais) {
    const row = statusPorCanal.get(canal.id);
    const realizou = row?.checkinRealizado === 1;
    if (realizou) {
      postaram.push({ nomeCanal: canal.name, nivel, semanasSemCheckin: 0 });
    } else {
      const semanas = semanasConsecutivasSemCheckin(canal.id, semana);
      naoPostaram.push({
        nomeCanal: canal.name,
        nivel,
        semanasSemCheckin: semanas,
      });
    }
  }

  const conteudo = mensagemResumoSemanal(semana, postaram, naoPostaram);

  try {
    const orientador = await client.users.fetch(config.orientadorId);
    await orientador.send({
      content: conteudo,
      allowedMentions: { parse: [] },
    });
    log.info(
      `Resumo semanal enviado ao orientador (${maskId(config.orientadorId)}) — ${postaram.length} em dia, ${naoPostaram.length} pendentes.`,
    );
    breaker.registrarSucesso();
  } catch (err) {
    log.error("Falha ao enviar resumo semanal ao orientador.", err);
    breaker.registrarFalha();
  }
}
