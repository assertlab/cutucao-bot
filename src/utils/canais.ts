import {
  CategoryChannel,
  ChannelType,
  Guild,
  GuildBasedChannel,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { config } from "../config";
import { isOrientacaoChannelName, nivelFromChannelName } from "./validacao";

export interface CanalOrientacao {
  canal: TextChannel;
  nivel: "phd" | "msc" | "bsc";
}

export function isCanalOrientacao(canal: GuildBasedChannel): canal is TextChannel {
  if (canal.type !== ChannelType.GuildText) return false;
  const parent = canal.parent;
  if (!parent || parent.type !== ChannelType.GuildCategory) return false;
  if (!isOrientacaoCategory(parent)) return false;
  return isOrientacaoChannelName(canal.name);
}

export function isOrientacaoCategory(category: CategoryChannel): boolean {
  return category.name.toLowerCase() === config.categoriaOrientacoes.toLowerCase();
}

export function listarCanaisOrientacao(guild: Guild): CanalOrientacao[] {
  const resultado: CanalOrientacao[] = [];
  for (const canal of guild.channels.cache.values()) {
    if (!isCanalOrientacao(canal)) continue;
    const nivel = nivelFromChannelName(canal.name);
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
