import {
  CategoryChannel,
  ChannelType,
  Guild,
  GuildBasedChannel,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { appConfig } from "../config/appConfig";
import { config } from "../config";
import { isOrientacaoChannelName, nivelFromChannelName } from "./validacao";

export interface CanalOrientacao {
  canal: TextChannel;
  nivel: string;
}

export function isCanalOrientacao(canal: GuildBasedChannel): canal is TextChannel {
  if (canal.type !== ChannelType.GuildText) return false;
  const parent = canal.parent;
  if (!parent || parent.type !== ChannelType.GuildCategory) return false;
  if (!isOrientacaoCategory(parent)) return false;
  return isOrientacaoChannelName(canal.name, Object.keys(appConfig.prefixos));
}

export function isOrientacaoCategory(category: CategoryChannel): boolean {
  const nome = category.name.toLowerCase();
  return appConfig.categorias.some((cat) => cat.toLowerCase() === nome);
}

export function listarCanaisOrientacao(guild: Guild): CanalOrientacao[] {
  const prefixes = Object.keys(appConfig.prefixos);
  const resultado: CanalOrientacao[] = [];
  for (const canal of guild.channels.cache.values()) {
    if (!isCanalOrientacao(canal)) continue;
    const nivel = nivelFromChannelName(canal.name, prefixes);
    if (!nivel) continue;
    resultado.push({ canal, nivel });
  }
  resultado.sort((a, b) => a.canal.name.localeCompare(b.canal.name));
  return resultado;
}

export function alunoIdFromCanal(canal: TextChannel): string | null {
  const overwrites = canal.permissionOverwrites.cache;
  const candidatos: string[] = [];
  for (const overwrite of overwrites.values()) {
    if (overwrite.type !== OverwriteType.Member) continue;
    if (overwrite.id === canal.client.user?.id) continue;
    if (overwrite.id === config.orientadorId) continue;
    const permiteVer = overwrite.allow.has(PermissionFlagsBits.ViewChannel);
    if (!permiteVer) continue;
    candidatos.push(overwrite.id);
  }
  if (candidatos.length === 1 && candidatos[0]) return candidatos[0];
  return null;
}
