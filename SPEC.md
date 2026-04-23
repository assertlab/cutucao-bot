# cutuCÃO 🐕 — Especificação Técnica

**Projeto:** cutuCÃO — Bot Discord do ASSERT Lab (CIn-UFPE) **Mascote:** Vira-lata caramelo com megafone **Objetivo:** Automatizar o acompanhamento de orientandos, substituindo o Carl-bot por uma solução própria com controle total. **Stack:** TypeScript + discord.js **Hospedagem:** Nuvem (gratuito ou baixo custo) **Repositório:** `cutucao-bot`

---

## 1. Visão geral

O **cutuCÃO** é o bot Discord do grupo de pesquisa ASSERT Lab. Como um bom vira-lata caramelo, ele é leal, persistente e não te deixa em paz até você fazer o que precisa fazer. Ele automatiza o ritual de check-in semanal dos orientandos, fornece visibilidade passiva ao orientador, e oferece comandos utilitários para o dia a dia do servidor.

### Personalidade do bot

O cutuCÃO se comunica com tom amigável, levemente humorado, usando metáforas caninas quando apropriado. Ele "cutuca" com carinho, não com cobrança agressiva. Exemplos:

- Lembrete: "🐕 Au au! Segunda-feira, hora do check-in!"
- Cobrança: "🐕 Oi, sumido(a)! Seu check-in desta semana ainda não apareceu. Tá tudo bem?"
- Resumo: "🐕 Relatório da matilha — semana de DD/MM a DD/MM"

### Princípios

- **O aluno é o protagonista.** O bot lembra, mas não substitui a responsabilidade do aluno.
- **Visibilidade passiva para o orientador.** Resumos automáticos, não microgerenciamento.
- **Configuração simples.** O orientador não precisa editar código para adicionar/remover alunos ou canais.
- **Leve e confiável.** Mínimo de dependências, máximo de uptime.

---

## 2. Funcionalidades

### 2.1. Check-in semanal automático

**Lembrete (segunda-feira, 09:00 horário de Brasília):**

- O bot envia uma mensagem em cada canal da categoria "Orientações" toda segunda às 09:00.
- A mensagem inclui o template de check-in e uma menção ao aluno do canal.
- Formato da mensagem:

```
🐕 **Au au! Check-in Semanal — [data no formato DD/MM/YYYY]**

Hora de atualizar seu progresso! Use o template abaixo:

**O que fiz desde o último check-in:**
-

**O que pretendo fazer esta semana:**
-

**Onde estou travado (se aplicável):**
-

**Próximo marco/entrega:**
-
```

**Cobrança automática (quarta-feira, 09:00):**

- Na quarta-feira, o bot verifica quais canais de orientação **não** tiveram mensagem do aluno desde o lembrete de segunda.
- Para esses canais, envia uma mensagem gentil de lembrete:

```
🐕 Oi, sumido(a)! Seu check-in desta semana ainda não apareceu. Tá tudo bem por aí?
Se precisar de ajuda com algo, é só dizer!
```

- Se o aluno não postar por **duas semanas consecutivas**, o bot envia uma mensagem privada (DM) ao orientador informando quais alunos estão inativos há 2+ semanas.

### 2.2. Resumo semanal para o orientador

**Sexta-feira, 18:00 (horário de Brasília):**

O bot envia uma mensagem privada (DM) ao orientador com um resumo da semana:

```
🐕 **Relatório da matilha — ASSERT Lab**
Semana de [DD/MM] a [DD/MM]

✅ Postaram check-in (X/Y):
- Fagner Fernandes (phd)
- Alana Fernandes (msc)
- Daniel Oliveira (bsc)
- ...

❌ Não postaram (X/Y):
- Anderson Marinho (msc) — 1 semana sem check-in
- Thiago Rocha (msc) — ⚠️ 3 semanas sem check-in
- ...

📈 Taxa de adesão: XX%
```

O resumo inclui um contador de semanas consecutivas sem check-in para identificar padrões de inatividade.

### 2.3. Mensagem de boas-vindas

Quando um novo membro entra no servidor, o bot envia uma mensagem no canal `#boas-vindas-e-regras`:

```
🐕 Bem-vindo(a) à matilha do ASSERT Lab, **[nome do usuário]**!

Leia as regras fixadas neste canal para entender como o servidor funciona.
Se você é orientando(a), seu canal individual está na categoria **Orientações**.

Dúvidas? É só perguntar no #café!
```

### 2.4. Comandos utilitários

| Comando              | Descrição                                                     | Quem pode usar |
| -------------------- | ------------------------------------------------------------- | -------------- |
| `/template`          | Exibe o template de check-in para copiar e colar              | Todos          |
| `/status`            | Mostra o status de check-in da semana (quem postou, quem não) | Orientador     |
| `/resumo @aluno`     | Mostra o histórico de check-ins do aluno (últimas 4 semanas)  | Orientador     |
| `/config canais`     | Lista os canais monitorados e permite adicionar/remover       | Orientador     |
| `/config orientador` | Define quem recebe os resumos semanais (por ID do Discord)    | Orientador     |
| `/config horarios`   | Ajusta horários de lembrete, cobrança e resumo                | Orientador     |
| `/ajuda`             | Exibe lista de comandos disponíveis                           | Todos          |

### 2.5. Detecção automática de canais

- O bot identifica automaticamente os canais da categoria "Orientações" pelo nome da categoria.
- Canais cujo nome começa com `phd-`, `msc-` ou `bsc-` são tratados como canais de orientação.
- Quando um novo canal é criado nessa categoria, o bot começa a monitorá-lo automaticamente — sem necessidade de configuração manual.
- O nível do aluno (phd/msc/bsc) é extraído do prefixo do canal.

---

## 3. Modelo de dados

### 3.1. Configuração do servidor (persistida)

```typescript
interface ServerConfig {
  guildId: string;
  orientadorUserId: string; // ID do orientador que recebe resumos
  categoriaOrientacoes: string; // Nome ou ID da categoria "Orientações"
  canalBoasVindas: string; // ID do canal de boas-vindas
  horarioLembrete: string; // Cron expression (default: "0 9 * * 1" — seg 09:00)
  horarioCobranca: string; // Cron expression (default: "0 9 * * 3" — qua 09:00)
  horarioResumo: string; // Cron expression (default: "0 18 * * 5" — sex 18:00)
  timezone: string; // Default: "America/Recife"
}
```

### 3.2. Registro de check-ins

```typescript
interface CheckinRecord {
  canalId: string;
  nomeCanal: string; // ex: "msc-alana-fernandes"
  nivel: "phd" | "msc" | "bsc";
  semana: string; // formato ISO week: "2026-W14"
  checkinRealizado: boolean;
  dataCheckin: Date | null;
  semanasConsecutivasSemCheckin: number;
}
```

### 3.3. Persistência

Para manter o bot leve e sem custo:

- **Opção recomendada:** SQLite (arquivo local) via `better-sqlite3`. Simples, sem servidor, suficiente para o volume de dados.
- **Alternativa se precisar de acesso remoto:** Turso (SQLite na nuvem, plano gratuito generoso).
- O banco armazena apenas configurações e histórico de check-ins. Não armazena mensagens.

---

## 4. Arquitetura

```
cutucao-bot/
├── src/
│   ├── index.ts                 # Entry point, client setup
│   ├── config.ts                # Carrega configuração do banco
│   ├── database.ts              # Setup e queries SQLite
│   ├── commands/
│   │   ├── template.ts          # /template
│   │   ├── status.ts            # /status
│   │   ├── resumo.ts            # /resumo @aluno
│   │   ├── config.ts            # /config (subcomandos)
│   │   └── ajuda.ts             # /ajuda
│   ├── events/
│   │   ├── ready.ts             # Inicialização, registro de comandos
│   │   ├── guildMemberAdd.ts    # Boas-vindas
│   │   ├── messageCreate.ts     # Detecta check-ins nos canais monitorados
│   │   └── channelCreate.ts     # Detecta novos canais na categoria Orientações
│   ├── jobs/
│   │   ├── scheduler.ts         # Setup do node-cron
│   │   ├── lembrete.ts          # Job de segunda 09:00
│   │   ├── cobranca.ts          # Job de quarta 09:00
│   │   └── resumo.ts            # Job de sexta 18:00
│   └── utils/
│       ├── canais.ts            # Helpers para identificar canais de orientação
│       ├── formatters.ts        # Formatação de mensagens
│       └── semana.ts            # Cálculo de semana ISO, datas
├── package.json
├── tsconfig.json
├── .env                         # DISCORD_TOKEN, GUILD_ID, ORIENTADOR_ID
└── README.md
```

### Dependências principais

```json
{
  "dependencies": {
    "discord.js": "^14.x",
    "node-cron": "^3.x",
    "better-sqlite3": "^11.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/better-sqlite3": "^7.x",
    "@types/node-cron": "^3.x"
  }
}
```

### Intents necessários (Discord Developer Portal)

- `Guilds` — acesso a canais e categorias
- `GuildMessages` — ler mensagens nos canais monitorados
- `GuildMembers` — detectar novos membros (boas-vindas)
- `MessageContent` — ler conteúdo das mensagens (para detectar check-ins)

---

## 5. Fluxos detalhados

### 5.1. Detecção de check-in

O bot precisa saber se o aluno "fez o check-in" na semana. A regra é simples:

- Qualquer mensagem enviada pelo aluno (não pelo bot) no canal de orientação entre segunda 00:00 e domingo 23:59 conta como check-in da semana.
- Não é necessário que o aluno use o template exato — qualquer mensagem é válida. A ideia é detectar atividade, não policiar formato.
- O bot escuta o evento `messageCreate` nos canais monitorados e registra a primeira mensagem da semana como check-in.

### 5.2. Fluxo do lembrete (segunda)

```
1. Cron dispara às 09:00 (America/Recife)
2. Bot lista canais da categoria "Orientações"
3. Para cada canal com prefixo phd-/msc-/bsc-:
   a. Envia a mensagem de lembrete com o template
   b. Registra no banco que a semana começou (checkinRealizado = false)
4. Log no console: "🐕 Lembretes enviados para X canais"
```

### 5.3. Fluxo da cobrança (quarta)

```
1. Cron dispara às 09:00 (America/Recife)
2. Bot consulta o banco: quais canais não tiveram check-in desde segunda?
3. Para cada canal sem check-in:
   a. Envia mensagem de lembrete gentil
4. Log no console: "🐕 Cobranças enviadas para X canais"
```

### 5.4. Fluxo do resumo (sexta)

```
1. Cron dispara às 18:00 (America/Recife)
2. Bot consulta o banco: status de todos os canais na semana
3. Agrupa em "postaram" e "não postaram"
4. Calcula semanas consecutivas sem check-in
5. Formata e envia DM ao orientador
6. Log no console: "🐕 Resumo semanal enviado"
```

### 5.5. Fluxo de boas-vindas

```
1. Evento guildMemberAdd dispara
2. Bot envia mensagem no canal #boas-vindas-e-regras
3. Log no console: "🐕 Boas-vindas enviadas para [nome]"
```

---

## 6. Variáveis de ambiente

```env
# .env
DISCORD_TOKEN=seu_token_aqui
GUILD_ID=id_do_servidor
ORIENTADOR_ID=id_do_usuario_orientador
DATABASE_PATH=./data/cutucao.db
TZ=America/Recife
```

---

## 7. Hospedagem

### Opção recomendada: Railway (https://railway.app)

- **Plano gratuito:** $5/mês de crédito gratuito (mais que suficiente para um bot leve).
- Deploy direto do GitHub.
- Suporte nativo a Node.js/TypeScript.
- Persistent disk para o SQLite.
- Boa confiabilidade e uptime.

### Alternativas

| Plataforma                 | Custo                     | Observações                                                                                   |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| **Render** (render.com)    | Gratuito (com limitações) | Plano free pode suspender após inatividade — ruim para bots que precisam estar sempre online. |
| **Fly.io**                 | Gratuito (com limites)    | Bom para bots leves. Requer um pouco mais de configuração.                                    |
| **Oracle Cloud Free Tier** | Gratuito permanente       | VM completa gratuita. Mais trabalho de setup, mas sem limites de tempo.                       |
| **VPS própria**            | ~$5/mês                   | DigitalOcean, Hetzner. Controle total.                                                        |

### Setup no Railway

```bash
# 1. Criar repositório no GitHub com o código do bot
# 2. Conectar o repositório ao Railway
# 3. Configurar variáveis de ambiente no dashboard do Railway
# 4. Deploy automático a cada push
```

---

## 8. Criação do bot no Discord Developer Portal

Antes de desenvolver, é necessário criar a aplicação do bot:

1. Acesse https://discord.com/developers/applications
2. Clique em "New Application" → nome: "cutuCÃO"
3. Vá em "Bot" no menu lateral
4. Clique em "Reset Token" e copie o token (guarde-o com segurança — é a senha do bot)
5. Ative os intents em "Privileged Gateway Intents":
   - ✅ Server Members Intent
   - ✅ Message Content Intent
6. Vá em "OAuth2" → "URL Generator"
   - Scopes: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Read Message History`, `View Channels`, `Use Slash Commands`
7. Copie a URL gerada e abra no navegador para adicionar o bot ao servidor

---

## 9. Segurança

Esta seção define os requisitos de segurança do cutuCÃO. O bot opera em um servidor acadêmico com dados de alunos reais — nomes, padrões de atividade, e potencialmente informações sensíveis sobre progresso acadêmico. A proteção desses dados e do servidor é obrigatória, não opcional.

### 9.1. Classificação de riscos identificados

| Risco                                            | Severidade  | Vetor                                                 | Mitigação                                                 |
| ------------------------------------------------ | ----------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Vazamento do token do bot                        | **Crítica** | Token commitado no GitHub ou exposto em logs          | Variáveis de ambiente + `.gitignore` + rotação periódica  |
| Escalação de privilégios via bot                 | **Alta**    | Bot com permissões excessivas é comprometido          | Princípio do menor privilégio nas permissões              |
| Injeção de comandos via input do usuário         | **Alta**    | Nomes de canais ou parâmetros de comandos manipulados | Sanitização e validação rigorosa de toda entrada          |
| Acesso não autorizado a comandos administrativos | **Alta**    | Aluno executa `/config` ou `/status`                  | Verificação de role/userId em todos os comandos restritos |
| Exposição do banco de dados                      | **Média**   | Acesso ao arquivo SQLite no servidor de hospedagem    | Permissões de arquivo + backup criptografado              |
| Abuso de rate limit da API do Discord            | **Média**   | Bug ou loop envia mensagens em massa                  | Rate limiting interno + circuit breaker                   |
| Dados pessoais em logs                           | **Média**   | Logs expõem nomes, IDs ou conteúdo de mensagens       | Política de logging sem PII                               |
| Dependências comprometidas (supply chain)        | **Média**   | Pacote npm malicioso                                  | Lock file + auditoria + dependências mínimas              |
| Bot adicionado a servidor não autorizado         | **Baixa**   | Alguém usa o link de convite em outro servidor        | Restrição a guild único                                   |
| DM spam via bot                                  | **Baixa**   | Bug faz bot enviar DMs em loop                        | Limites internos de envio de DMs                          |

### 9.2. Proteção de credenciais

**Token do bot:**

- NUNCA commitado no repositório. O `.gitignore` deve incluir `.env`, `*.db`, `data/`, e qualquer arquivo de configuração local.
- Armazenado exclusivamente via variáveis de ambiente da plataforma de hospedagem (Railway, Fly.io, etc.).
- Rotação do token a cada 6 meses ou imediatamente em caso de suspeita de comprometimento (via Discord Developer Portal → Bot → Reset Token).
- Se o repositório for público, habilitar o GitHub Secret Scanning para detecção automática de tokens expostos.

**Arquivo `.gitignore` obrigatório:**

```
.env
.env.*
*.db
data/
node_modules/
dist/
```

**Variáveis de ambiente no CI/CD:**

- Nunca usar variáveis de ambiente em arquivos de configuração do repositório (ex: `docker-compose.yml` com valores hardcoded).
- No Railway/Fly.io, configurar via dashboard — nunca via CLI em logs compartilhados.

### 9.3. Princípio do menor privilégio

**Permissões do bot no Discord:**

O bot deve solicitar APENAS as permissões estritamente necessárias. A spec original já lista as corretas, mas reforçando o que NÃO deve ter:

| Permissão              | Necessária?  | Justificativa                         |
| ---------------------- | ------------ | ------------------------------------- |
| `Send Messages`        | ✅ Sim       | Enviar lembretes e respostas          |
| `Read Message History` | ✅ Sim       | Verificar check-ins                   |
| `View Channels`        | ✅ Sim       | Listar canais da categoria            |
| `Use Slash Commands`   | ✅ Sim       | Comandos utilitários                  |
| `Administrator`        | ❌ **NUNCA** | Dá controle total — risco inaceitável |
| `Manage Channels`      | ❌ Não       | O bot não cria/deleta canais          |
| `Manage Roles`         | ❌ Não       | O bot não gerencia cargos             |
| `Manage Messages`      | ❌ Não       | O bot não deleta mensagens de outros  |
| `Mention Everyone`     | ❌ Não       | O bot não precisa pingar @everyone    |
| `Ban/Kick Members`     | ❌ **NUNCA** | Fora do escopo                        |

**Posição do cargo do bot na hierarquia de roles:**

- O cargo do cutuCÃO deve ficar **abaixo** do cargo de Orientador e de qualquer cargo administrativo.
- Deve ficar **acima** apenas dos cargos que precisa interagir (para enviar mensagens nos canais privados).

**Restrição a guild único:**

```typescript
// No evento ready ou em cada comando, verificar:
if (interaction.guildId !== process.env.GUILD_ID) {
  return; // Ignora silenciosamente
}
```

O bot deve recusar operar em qualquer servidor que não seja o GUILD_ID configurado. Se alguém obtiver o link de convite e adicionar o bot a outro servidor, ele não deve funcionar.

### 9.4. Validação e sanitização de entrada

**Toda entrada do usuário é potencialmente maliciosa.** Isso inclui:

- Parâmetros de slash commands (`/config horarios`, `/resumo @aluno`)
- Nomes de canais (usados para extrair nível phd/msc/bsc)
- Nomes de usuário (usados em mensagens de boas-vindas)

**Regras de sanitização:**

```typescript
// Validar cron expressions antes de aceitar
function isValidCron(expr: string): boolean {
  // Whitelist de padrões seguros — não aceitar expressões arbitrárias
  const safePattern = /^(\d{1,2})\s(\d{1,2})\s\*\s\*\s([0-6])$/;
  return safePattern.test(expr);
}

// Sanitizar nomes para exibição em mensagens
function sanitizeDisplayName(name: string): string {
  // Remove formatação Markdown que poderia ser usada para injection
  return name.replace(/[*_~`|>@#]/g, "");
}

// Validar IDs do Discord (sempre numéricos)
function isValidDiscordId(id: string): boolean {
  return /^\d{17,20}$/.test(id);
}

// Validar prefixo de canal
function isOrientacaoChannel(name: string): boolean {
  return /^(phd|msc|bsc)-[a-z0-9-]+$/.test(name);
}
```

**Proteção contra menções indesejadas:**

- Ao construir mensagens que incluam nomes de usuário, usar `allowedMentions: { parse: [] }` para evitar que o bot seja usado como vetor de mention spam.
- Exceção: o lembrete de check-in que menciona o aluno do canal, onde o mention é intencional.

### 9.5. Controle de acesso a comandos

Os comandos administrativos (`/status`, `/resumo`, `/config`) devem ter verificação dupla:

```typescript
// Verificação por userId (primária)
if (interaction.user.id !== process.env.ORIENTADOR_ID) {
  await interaction.reply({
    content: "🐕 Esse comando é só pro orientador!",
    ephemeral: true, // Só quem executou vê a resposta
  });
  return;
}

// Verificação por role (secundária, para futura expansão)
const member = interaction.member as GuildMember;
if (!member.roles.cache.some((role) => role.name === "Orientador")) {
  await interaction.reply({ content: "🐕 Acesso negado.", ephemeral: true });
  return;
}
```

**Respostas ephemeral:** Todos os comandos administrativos devem usar `ephemeral: true` por padrão, para que os dados (lista de quem não fez check-in, configurações) não fiquem visíveis para outros membros do canal.

### 9.6. Proteção de dados pessoais

O cutuCÃO lida com dados de alunos reais. Mesmo sendo um bot interno, as seguintes práticas devem ser seguidas:

**Minimização de dados:**

- O banco armazena APENAS: ID do canal, nome do canal, semana, e se houve check-in.
- **NUNCA** armazenar: conteúdo de mensagens, IDs de usuários dos alunos, endereços de e-mail, ou qualquer dado pessoal além do estritamente necessário.
- O nome do aluno é derivado do nome do canal (que é público no servidor), não de dados pessoais adicionais.

**Retenção de dados:**

- Registros de check-in mais antigos que **6 meses** devem ser automaticamente deletados (job de limpeza mensal).
- Implementar comando `/config limpar-historico` para limpeza manual sob demanda.

```typescript
// Job mensal de limpeza
function limparHistoricoAntigo(): void {
  const seisAtras = new Date();
  seisAtras.setMonth(seisAtras.getMonth() - 6);
  db.prepare("DELETE FROM checkins WHERE dataCheckin < ?").run(
    seisAtras.toISOString(),
  );
}
```

**Logging seguro:**

- Logs no console NUNCA devem incluir: conteúdo de mensagens, tokens, IDs completos de usuários.
- Formato seguro de log: `"🐕 Check-in registrado em canal msc-*** (semana 2026-W14)"` — truncar nomes nos logs.
- Em produção, usar nível de log `info` (sem `debug` que poderia expor dados).

### 9.7. Proteção do banco de dados

**Segurança do SQLite:**

```typescript
// Habilitar WAL mode para integridade em caso de crash
db.pragma("journal_mode = WAL");

// Usar prepared statements SEMPRE — nunca concatenar strings em queries
// ✅ CORRETO
db.prepare("SELECT * FROM checkins WHERE canalId = ?").get(canalId);

// ❌ NUNCA
db.exec(`SELECT * FROM checkins WHERE canalId = '${canalId}'`);
```

**Backup:**

- Configurar backup automático semanal do arquivo `.db` (no Railway, usar o persistent disk).
- Se usar Turso, os backups são automáticos.
- O arquivo de banco NUNCA deve estar no repositório Git.

**Permissões de arquivo:**

- O arquivo `.db` deve ter permissões `600` (leitura/escrita apenas pelo dono do processo).

### 9.8. Rate limiting e proteção contra loops

Um bug ou condição de corrida pode fazer o bot enviar centenas de mensagens em sequência, o que violaria os rate limits do Discord e potencialmente resultaria no banimento do bot.

```typescript
// Rate limiter interno
const MESSAGE_LIMIT = 20; // Máximo de mensagens por ciclo de job
const DM_LIMIT = 3; // Máximo de DMs por ciclo
const COOLDOWN_MS = 1000; // Delay entre mensagens

async function enviarComRateLimit(
  canais: Channel[],
  mensagem: string,
): Promise<void> {
  let enviados = 0;
  for (const canal of canais) {
    if (enviados >= MESSAGE_LIMIT) {
      console.warn("🐕 Rate limit interno atingido. Abortando envio.");
      break;
    }
    await canal.send(mensagem);
    enviados++;
    await sleep(COOLDOWN_MS);
  }
}
```

**Circuit breaker:** Se qualquer job falhar 3 vezes consecutivas, desabilitar temporariamente e notificar o orientador via DM.

### 9.9. Segurança da cadeia de dependências

**Dependências mínimas (já definido na spec):**

- Apenas 4 dependências de produção: `discord.js`, `node-cron`, `better-sqlite3`, `dotenv`.
- Quanto menos dependências, menor a superfície de ataque.

**Práticas obrigatórias:**

- Usar `package-lock.json` e sempre commitar o lock file.
- Rodar `npm audit` antes de cada deploy e corrigir vulnerabilidades de severidade alta/crítica.
- Fixar versões major das dependências (já feito com `^14.x` etc.).
- Habilitar Dependabot ou Renovate no GitHub para alertas automáticos de vulnerabilidades.

### 9.10. Segurança do repositório

**Se o repositório for público (open source):**

- Garantir que `.env`, `*.db` e `data/` estejam no `.gitignore` ANTES do primeiro commit.
- Habilitar GitHub Secret Scanning e Push Protection para bloquear commits com tokens.
- Usar GitHub Environments com proteção de branch para secrets de deploy.
- O `README.md` deve instruir contribuidores a NUNCA commitar credenciais.

**Branch protection:**

- Branch `main` protegida: sem push direto, requer PR.
- Isso previne que um contribuidor (aluno) acidentalmente exponha credenciais.

### 9.11. Segurança na hospedagem

**Railway / Fly.io / qualquer PaaS:**

- Habilitar 2FA (autenticação de dois fatores) na conta da plataforma de hospedagem.
- Habilitar 2FA na conta do Discord Developer Portal.
- Habilitar 2FA na conta do GitHub.
- Revisar periodicamente quem tem acesso ao projeto na plataforma de hospedagem.
- Não compartilhar credenciais de acesso com alunos — se um aluno precisar contribuir com código, ele faz via PR no GitHub, sem acesso ao deploy.

### 9.12. Resposta a incidentes

Se houver suspeita de comprometimento:

1. **Imediato:** Rotacionar o token do bot no Discord Developer Portal (Reset Token).
2. **Em seguida:** Verificar logs da plataforma de hospedagem para atividade anormal.
3. **Depois:** Revisar histórico de commits no GitHub para exposição acidental de credenciais.
4. **Se o banco foi comprometido:** O impacto é baixo (sem dados pessoais sensíveis), mas regenerar o banco e notificar os membros do servidor.
5. **Documentar:** Registrar o incidente e as ações tomadas para referência futura.

### 9.13. Checklist de segurança para deploy

Antes de colocar o cutuCÃO em produção, verificar todos os itens:

- [ ] `.env` está no `.gitignore` e NÃO foi commitado em nenhum ponto do histórico
- [ ] Token do bot está configurado APENAS via variáveis de ambiente da plataforma
- [ ] Bot tem APENAS as permissões listadas na seção 9.3 (sem Administrator)
- [ ] Cargo do bot está posicionado corretamente na hierarquia de roles
- [ ] Todos os comandos administrativos verificam `ORIENTADOR_ID` antes de executar
- [ ] Respostas de comandos administrativos usam `ephemeral: true`
- [ ] Todas as queries SQL usam prepared statements
- [ ] Nenhum log expõe conteúdo de mensagens ou tokens
- [ ] Rate limiter interno está implementado nos jobs de envio
- [ ] Restrição de guild único está implementada
- [ ] `npm audit` executado sem vulnerabilidades de severidade alta
- [ ] `package-lock.json` commitado no repositório
- [ ] 2FA habilitado no Discord Developer Portal, GitHub e plataforma de hospedagem
- [ ] GitHub Secret Scanning habilitado (se repositório público)
- [ ] Backup do banco de dados configurado
- [ ] Job de limpeza de dados antigos implementado

---

## 10. Roadmap de implementação

### Fase 1 — MVP (prioridade)

- [x] Setup do projeto (TypeScript, discord.js, SQLite)
- [x] Implementar `.gitignore` com proteção de credenciais (seção 9.2)
- [x] Restrição de guild único (seção 9.3)
- [x] Detecção automática de canais de orientação
- [x] Lembrete de check-in (segunda 09:00) com rate limiting (seção 9.8)
- [x] Detecção de mensagens como check-in
- [x] Cobrança automática (quarta 09:00)
- [x] Resumo semanal para o orientador (sexta 18:00) com ephemeral DM
- [x] Controle de acesso a comandos (seção 9.5)
- [x] Sanitização de entrada em todos os inputs (seção 9.4)
- [ ] Deploy no Railway com 2FA habilitado
- [ ] Executar checklist de segurança (seção 9.13)

### Fase 2 — Complementos

- [x] Mensagem de boas-vindas com nome sanitizado
- [x] Comando `/template`
- [x] Comando `/status` (ephemeral)
- [x] Comando `/resumo #canal` (ephemeral)
- [x] Comando `/ajuda`
- [x] Job de limpeza de dados antigos (seção 9.6)

### Fase 3 — Configuração dinâmica

- [ ] Comando `/config canais` com validação
- [ ] Comando `/config orientador` com validação de ID
- [ ] Comando `/config horarios` com validação de cron (seção 9.4)
- [ ] Detecção automática de novos canais na categoria
- [ ] Habilitar Dependabot/Renovate no GitHub

### Fase 4 — Melhorias futuras (opcional)

- [ ] Dashboard web simples para visualizar status dos check-ins
- [ ] Integração com Google Calendar para próximas reuniões
- [ ] Notificação de marcos/deadlines próximos (qualificação, defesa)
- [ ] Métricas de longo prazo (taxa de adesão por mês, evolução)

### Fase 5 — Engenharia de Software

- [x] M1: Externalizar mensagens para arquivo JSON + serviço de templates
- [x] M2: Implementar padrão Repository para checkins e configurações
- [ ] M3: Container de injeção de dependências
- [x] M4: Testes automatizados com Vitest (unitários + integração)
- [ ] M5: CI/CD com GitHub Actions (typecheck, testes, audit)
- [ ] M6: Logs estruturados + alertas por DM em falhas de jobs

### Fase 6 — Dashboard e gestão

- [ ] M7: Dashboard web para visualização de status e métricas
- [ ] Edição de mensagens/templates via dashboard
- [ ] Configuração de horários e parâmetros via dashboard
- [ ] Autenticação OAuth2 via Discord
- [ ] Métricas históricas de adesão

---

## 11. Instruções para Claude Code

Ao iniciar o desenvolvimento com Claude Code, use este documento como contexto. Sugestão de prompt inicial:

```
Leia o arquivo SPEC.md que contém a especificação completa do cutuCÃO —
o bot Discord do ASSERT Lab para acompanhamento de orientandos acadêmicos.
O cutuCÃO é um vira-lata caramelo com megafone que cutuca os alunos
para fazerem seus check-ins semanais.

Comece pela Fase 1 (MVP): setup do projeto, detecção de canais,
lembrete de check-in, detecção de mensagens, cobrança automática,
e resumo semanal.

IMPORTANTE: A seção 9 (Segurança) é obrigatória. Implemente todas
as mitigações desde o início — especialmente: proteção de credenciais,
princípio do menor privilégio, sanitização de entrada, controle de acesso
a comandos, rate limiting interno, e prepared statements no SQLite.

Use discord.js v14, node-cron, better-sqlite3, e TypeScript.
Siga a arquitetura de diretórios descrita na spec.
O tom das mensagens do bot deve ser amigável e levemente humorado,
com referências caninas quando apropriado.
```

---

## Notas finais

- O cutuCÃO substitui completamente o Carl-bot para as funcionalidades de check-in. O Carl-bot pode ser removido do servidor após o bot estar estável.
- O bot não armazena conteúdo das mensagens — apenas registra se houve atividade no canal. Isso respeita a privacidade dos alunos.
- O logo do cutuCÃO (vira-lata caramelo com megafone) deve ser usado como avatar do bot no Discord Developer Portal.
- O código será open source e pode ser adaptado por outros grupos de pesquisa.
