import { SlashCommand } from "./types";
import { ajudaCommand } from "./ajuda";
import { exportarCommand } from "./exportar";
import { limparCommand } from "./limpar";
import { resumoCommand } from "./resumo";
import { statusCommand } from "./status";
import { templateCommand } from "./template";
import { testeBoasVindasCommand } from "./testeBoasVindas";
import { testeLembreteCommand } from "./testeLembrete";
import { usoCommand } from "./uso";

const todos: SlashCommand[] = [
  ajudaCommand,
  exportarCommand,
  limparCommand,
  resumoCommand,
  statusCommand,
  templateCommand,
  testeBoasVindasCommand,
  testeLembreteCommand,
  usoCommand,
];

export const commands: ReadonlyMap<string, SlashCommand> = new Map(
  todos.map((cmd) => [cmd.data.name, cmd]),
);
