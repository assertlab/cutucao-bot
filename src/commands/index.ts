import { SlashCommand } from "./types";
import { ajudaCommand } from "./ajuda";
import { resumoCommand } from "./resumo";
import { statusCommand } from "./status";
import { templateCommand } from "./template";
import { testeBoasVindasCommand } from "./testeBoasVindas";
import { testeLembreteCommand } from "./testeLembrete";

const todos: SlashCommand[] = [
  ajudaCommand,
  resumoCommand,
  statusCommand,
  templateCommand,
  testeBoasVindasCommand,
  testeLembreteCommand,
];

export const commands: ReadonlyMap<string, SlashCommand> = new Map(
  todos.map((cmd) => [cmd.data.name, cmd]),
);
