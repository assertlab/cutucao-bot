import { Client } from "discord.js";
import cron, { ScheduledTask } from "node-cron";
import { appConfig } from "../config/appConfig";
import { config } from "../config";
import { log } from "../utils/log";
import { jobCobranca } from "./cobranca";
import { jobLembrete } from "./lembrete";
import { jobResumo } from "./resumo";

const tasks: ScheduledTask[] = [];

function agendar(
  rotulo: string,
  expressao: string,
  acao: () => Promise<void>,
): void {
  if (!cron.validate(expressao)) {
    throw new Error(`Cron expression inválida para ${rotulo}: "${expressao}".`);
  }
  const task = cron.schedule(
    expressao,
    async () => {
      log.info(`Disparando job: ${rotulo}.`);
      try {
        await acao();
      } catch (err) {
        log.error(`Falha no job ${rotulo}.`, err);
      }
    },
    { timezone: config.timezone },
  );
  tasks.push(task);
  log.info(`Job "${rotulo}" agendado (${expressao}, ${config.timezone}).`);
}

export function iniciarAgendador(client: Client<true>): void {
  agendar("lembrete", appConfig.horarios.lembrete, () => jobLembrete(client));
  agendar("cobranca", appConfig.horarios.cobranca, () => jobCobranca(client));
  agendar("resumo", appConfig.horarios.resumo, () => jobResumo(client));
}

export function pararAgendador(): void {
  for (const task of tasks) task.stop();
  tasks.length = 0;
}
