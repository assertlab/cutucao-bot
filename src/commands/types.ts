import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface SlashCommand {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;
  orientadorOnly: boolean;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
