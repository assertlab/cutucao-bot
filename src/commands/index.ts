import { SlashCommand } from "./types";
import { testeLembreteCommand } from "./testeLembrete";

const todos: SlashCommand[] = [testeLembreteCommand];

export const commands: ReadonlyMap<string, SlashCommand> = new Map(
  todos.map((cmd) => [cmd.data.name, cmd]),
);
