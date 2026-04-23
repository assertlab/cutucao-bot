import { Client } from "discord.js";
import { config } from "../config";
import { checkinRepo } from "../repositories";
import { alunoIdFromCanal, listarCanaisOrientacao } from "../utils/canais";
import { mensagemLembrete } from "../utils/formatters";
import { log, maskChannelName } from "../utils/log";
import { CircuitBreaker, forEachComRateLimit } from "../utils/rateLimit";
import { currentIsoWeek, formatDateBr } from "../utils/semana";

const breaker = new CircuitBreaker("lembrete");

export async function jobLembrete(client: Client<true>): Promise<void> {
  if (breaker.estaAberto()) {
    log.warn("Job lembrete pulado — circuit breaker aberto.");
    return;
  }

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    log.error("Guild configurado não encontrado no cache ao executar lembrete.");
    breaker.registrarFalha();
    return;
  }

  const canais = listarCanaisOrientacao(guild);
  if (canais.length === 0) {
    log.info("Nenhum canal de orientação encontrado. Lembrete não enviado.");
    breaker.registrarSucesso();
    return;
  }

  const semana = currentIsoWeek(config.timezone);
  const dataFormatada = formatDateBr(new Date(), config.timezone);

  const enviados = await forEachComRateLimit(
    canais,
    {
      limite: config.limites.mensagensPorCiclo,
      cooldownMs: config.limites.cooldownMs,
      rotulo: "lembrete",
    },
    async ({ canal, nivel }) => {
      checkinRepo.registrarLembrete({
        canalId: canal.id,
        nomeCanal: canal.name,
        nivel,
        semana,
      });
      const alunoId = alunoIdFromCanal(canal);
      await canal.send({
        content: mensagemLembrete(dataFormatada, alunoId),
        allowedMentions: alunoId ? { users: [alunoId] } : { parse: [] },
      });
      log.info(`Lembrete enviado em ${maskChannelName(canal.name)}.`);
    },
  );

  log.info(`Lembretes enviados para ${enviados}/${canais.length} canais.`);
  breaker.registrarSucesso();
}
