# cutuCÃO — Proposta de Melhorias de Engenharia de Software

## Diagnóstico do estado atual

O MVP foi entregue rápido e funciona bem, mas tem débitos técnicos esperados para essa fase:

1. **Mensagens hardcoded** — Textos espalhados em `formatters.ts` e nos comandos. Qualquer edição exige mexer no código, recompilar e redeployar.
2. **Configuração estática** — Horários, categoria, orientador estão no `.env`. Mudar exige acesso ao servidor de hospedagem.
3. **Sem testes automatizados** — Toda validação é manual.
4. **Sem observabilidade** — Logs vão pro console, sem persistência ou alertas.
5. **Acoplamento** — Jobs acessam diretamente o banco e o Discord client, dificultando testes e reutilização.

## Melhorias propostas

### M1. Externalização de mensagens (i18n-ready)

**Problema:** Mensagens hardcoded tornam edição custosa e impossibilitam internacionalização futura.

**Solução:** Extrair todas as mensagens para um sistema de templates com dois níveis:

- **Nível 1 (imediato):** Arquivo JSON/YAML de mensagens (`mensagens.json`) carregado em runtime. Editável sem recompilar.
- **Nível 2 (futuro):** Mensagens armazenadas no banco de dados, editáveis via dashboard.

**Estrutura proposta:**

```typescript
// src/mensagens/index.ts
interface MensagemTemplate {
  id: string;
  categoria:
    | "lembrete"
    | "cobranca"
    | "resumo"
    | "boas-vindas"
    | "comando"
    | "erro";
  texto: string; // Suporta placeholders: {{nome}}, {{data}}, {{canal}}
  descricao: string; // Para o dashboard: "Mensagem enviada toda segunda..."
}
```

```json
// mensagens.json
{
  "lembrete_semanal": {
    "categoria": "lembrete",
    "texto": "🐕 **Au au! Check-in Semanal — {{data}}**\n\nHora de atualizar seu progresso!...",
    "descricao": "Lembrete enviado toda segunda-feira às 09:00 em cada canal de orientação"
  },
  "cobranca_gentil": {
    "categoria": "cobranca",
    "texto": "🐕 Oi, sumido(a)! Seu check-in desta semana ainda não apareceu...",
    "descricao": "Enviado na quarta para quem não postou check-in"
  }
}
```

**Benefícios:** Edição sem recompilação, preparação para i18n, preparação para dashboard, separação de concerns.

### M2. Padrão Repository para acesso a dados

**Problema:** Queries SQL espalhadas em `database.ts` com acesso direto dos jobs e comandos.

**Solução:** Implementar o padrão Repository, encapsulando o acesso ao banco:

```typescript
// src/repositories/checkinRepository.ts
interface CheckinRepository {
  registrar(canalId: string, semana: string): void;
  buscarPorSemana(semana: string): CheckinRecord[];
  buscarHistorico(canalId: string, semanas: number): CheckinRecord[];
  contarSemanasInativas(canalId: string): number;
  limparAntigos(mesesAtras: number): number;
}

// src/repositories/configRepository.ts
interface ConfigRepository {
  getOrientadorId(): string;
  getHorarios(): Horarios;
  getMensagem(id: string): string;
  setMensagem(id: string, texto: string): void;
}
```

**Benefícios:** Jobs e comandos não sabem que o banco é SQLite, facilitando testes com mocks e futura migração se necessário.

### M3. Injeção de dependências leve

**Problema:** `index.ts` instancia tudo diretamente, criando acoplamento forte.

**Solução:** Um container simples (sem framework pesado) que centraliza a criação de dependências:

```typescript
// src/container.ts
interface Container {
  db: Database;
  checkinRepo: CheckinRepository;
  configRepo: ConfigRepository;
  mensagens: MensagemService;
  discord: Client;
}

function criarContainer(): Container {
  const db = new Database(config.databasePath);
  const checkinRepo = new SQLiteCheckinRepository(db);
  const configRepo = new SQLiteConfigRepository(db);
  const mensagens = new MensagemService(configRepo);
  // ...
}
```

**Benefícios:** Testabilidade (injeta mocks), flexibilidade, setup explícito.

### M4. Testes automatizados

**Problema:** Sem testes, qualquer mudança pode quebrar funcionalidades silenciosamente.

**Solução:** Testes em três níveis:

- **Unitários:** Validação, sanitização, cálculo de semanas, formatação de mensagens. Sem I/O.
- **Integração:** Repositories contra um banco SQLite in-memory. Sem Discord.
- **E2E (futuro):** Bot de teste em um servidor Discord de staging.

**Framework:** Vitest (rápido, TypeScript nativo, compatível com o ecossistema).

```
src/
├── __tests__/
│   ├── utils/
│   │   ├── validacao.test.ts
│   │   ├── semana.test.ts
│   │   └── formatters.test.ts
│   ├── repositories/
│   │   ├── checkinRepository.test.ts
│   │   └── configRepository.test.ts
│   └── jobs/
│       ├── lembrete.test.ts
│       └── cobranca.test.ts
```

**Benefícios:** Confiança para refatorar, documentação viva do comportamento esperado, CI/CD mais robusto.

### M5. CI/CD com GitHub Actions

**Problema:** Sem pipeline, bugs podem ir para produção sem verificação.

**Solução:** Pipeline mínimo no GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm audit --audit-level=high
```

**Benefícios:** Typecheck e testes rodam automaticamente em todo PR, `npm audit` pega vulnerabilidades antes do deploy.

### M6. Observabilidade

**Problema:** Logs vão pro console sem estrutura. Se o bot falha às 3h da manhã, ninguém sabe até verificar manualmente.

**Solução em dois níveis:**

- **Nível 1 (imediato):** Logs estruturados em JSON (para Railway parsear) + alerta via DM ao orientador quando um job falha (o circuit breaker já faz isso parcialmente).
- **Nível 2 (futuro):** Métricas simples no banco: taxa de adesão semanal, tempo de resposta do bot, uptime. Consumidas pelo dashboard.

### M7. Dashboard web (Fase 5)

**Problema:** O orientador só vê dados via comandos slash no Discord — sem visão histórica ou gestão.

**Solução:** Dashboard web leve (React ou Next.js) que consome a mesma base SQLite (ou uma API mínima):

**Funcionalidades:**

- Visualizar status dos check-ins da semana atual
- Histórico de adesão por aluno (gráfico de timeline)
- Editar mensagens/templates do bot (CRUD no banco)
- Configurar horários e parâmetros sem mexer no `.env`
- Métricas agregadas: taxa de adesão por mês, ranking de engajamento

**Autenticação:** OAuth2 do Discord (login com a conta do orientador).

## Priorização sugerida

| Melhoria                        | Esforço | Impacto | Prioridade |
| ------------------------------- | ------- | ------- | ---------- |
| M1. Externalização de mensagens | Médio   | Alto    | 🔴 Alta    |
| M2. Padrão Repository           | Médio   | Alto    | 🔴 Alta    |
| M4. Testes automatizados        | Médio   | Alto    | 🔴 Alta    |
| M5. CI/CD                       | Baixo   | Médio   | 🟡 Média   |
| M3. Injeção de dependências     | Baixo   | Médio   | 🟡 Média   |
| M6. Observabilidade             | Médio   | Médio   | 🟡 Média   |
| M7. Dashboard web               | Alto    | Alto    | 🟢 Futura  |

## Proposta de novas fases no SPEC.md

### Fase 5 — Engenharia de Software

- [ ] M1: Externalizar mensagens para arquivo JSON + serviço de templates
- [ ] M2: Implementar padrão Repository para checkins e configurações
- [ ] M3: Container de injeção de dependências
- [ ] M4: Testes automatizados com Vitest (unitários + integração)
- [ ] M5: CI/CD com GitHub Actions (typecheck, testes, audit)
- [ ] M6: Logs estruturados + alertas por DM em falhas de jobs

### Fase 6 — Dashboard e gestão

- [ ] M7: Dashboard web para visualização de status e métricas
- [ ] Edição de mensagens/templates via dashboard
- [ ] Configuração de horários e parâmetros via dashboard
- [ ] Autenticação OAuth2 via Discord
- [ ] Métricas históricas de adesão
