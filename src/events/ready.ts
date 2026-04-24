import { Client } from "discord.js";
import { appConfig } from "../config/appConfig";
import { commands } from "../commands";
import { config } from "../config";
import { log } from "../utils/log";
import { listarCanaisOrientacao } from "../utils/canais";

export async function onReady(client: Client<true>): Promise<void> {
  log.info(`Logado como ${client.user.tag}.`);

  const guilds = [...client.guilds.cache.values()];
  for (const guild of guilds) {
    if (guild.id !== config.guildId) {
      log.warn("Bot presente em guild não autorizada. Saindo.", {
        guildId: guild.id,
      });
      try {
        await guild.leave();
      } catch (err) {
        log.error("Falha ao sair de guild não autorizada.", err);
      }
    }
  }

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) {
    log.error(
      "Bot não está no GUILD_ID configurado. Reinstale o bot no servidor correto.",
    );
    return;
  }

  const canais = listarCanaisOrientacao(guild);
  log.info(
    `Categorias ${JSON.stringify(appConfig.categorias)} detectadas com ${canais.length} canal(is) de orientação.`,
  );

  try {
    const payload = [...commands.values()].map((cmd) => cmd.data.toJSON());
    await guild.commands.set(payload);
    log.info(`${payload.length} comando(s) slash registrado(s) no guild.`);
  } catch (err) {
    log.error("Falha ao registrar comandos slash.", err);
  }
}
