# 🐕 cutuCÃO

**O vira-lata caramelo que não te deixa esquecer o check-in.**

Bot Discord do [ASSERT Lab](https://assertlab.github.io/) (CIn-UFPE) para acompanhamento de orientandos de graduação, mestrado e doutorado. Ele envia lembretes semanais, cobra com carinho quem esqueceu, e manda um relatório pro orientador — tudo de forma assíncrona e sem microgerenciamento.

<p align="center">
  <img src="assets/cutucao-logo.svg" alt="cutuCÃO logo" width="200">
</p>

---

## Por que o cutuCÃO existe?

Orientar 15+ alunos simultaneamente gera um problema real de comunicação: WhatsApp mistura vida pessoal com pesquisa, conversas se perdem, e o orientador acaba precisando cobrar individualmente cada aluno. Ferramentas como Trello e Notion foram testadas, mas criavam mais burocracia do que ajudavam.

O cutuCÃO nasce de uma filosofia simples: **o aluno é dono do próprio progresso, o orientador precisa apenas de visibilidade passiva**. O bot automatiza o ritual de check-in semanal e transforma o silêncio em dado — se o aluno não postou, isso já é o sinal de alerta.

## Funcionalidades

**Lembretes automáticos** — Toda segunda-feira às 09:00, o cutuCÃO posta em cada canal de orientação um lembrete com o template de check-in.

**Cobrança gentil** — Na quarta-feira, quem não postou recebe uma cutucada. Se o silêncio passar de duas semanas, o orientador é notificado por DM.

**Relatório semanal** — Toda sexta às 18:00, o orientador recebe um resumo por DM: quem postou, quem não postou, e um contador de semanas consecutivas de inatividade.

**Boas-vindas** — Novos membros recebem automaticamente uma mensagem de boas-vindas com orientações.

**Comandos úteis:**

| Comando           | Descrição                                    | Acesso     |
| ----------------- | -------------------------------------------- | ---------- |
| `/template`       | Exibe o template de check-in                 | Todos      |
| `/ajuda`          | Lista todos os comandos                      | Todos      |
| `/status`         | Quem postou e quem não postou na semana      | Orientador |
| `/resumo #canal`  | Histórico de check-ins das últimas 4 semanas | Orientador |
| `/teste-lembrete` | Dispara manualmente o job de lembrete        | Orientador |

**Detecção automática** — Canais com prefixo `phd-`, `msc-` ou `bsc-` na categoria "Orientações" são monitorados automaticamente. Criou um canal novo? O cutuCÃO já começa a vigiar.

## Stack

- **Runtime:** Node.js 18+
- **Linguagem:** TypeScript
- **Framework:** discord.js v14
- **Banco de dados:** SQLite (via better-sqlite3)
- **Agendamento:** node-cron
- **Hospedagem:** Railway

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [Git](https://git-scm.com/)
- Uma aplicação de bot criada no [Discord Developer Portal](https://discord.com/developers/applications)

## Setup

### 1. Clone o repositório

```bash
git clone https://github.com/assertlab/cutucao-bot.git
cd cutucao-bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=seu_token_aqui
GUILD_ID=id_do_servidor
ORIENTADOR_ID=id_do_usuario_orientador
DATABASE_PATH=./data/cutucao.db
TZ=America/Recife
```

Para obter os IDs, ative o **Modo de Desenvolvedor** no Discord (Configurações → Avançado) e clique com botão direito nos elementos para copiar.

### 4. (Opcional) Configure o config.json

Copie o arquivo de exemplo e ajuste conforme o seu servidor:

```bash
cp config.example.json config.json
```

Campos configuráveis: categorias monitoradas, prefixos dos canais e seus labels nos relatórios, nome do canal de boas-vindas, horários dos jobs (cron), limiares de escalação e visualização. Todos os campos têm valores padrão — se preferir manter o comportamento original, pule este passo.

### 5. Compile e rode

```bash
npm run build
npm start
```

O bot deve aparecer como online no seu servidor Discord. No log inicial você verá quais categorias e quantos canais foram detectados.

## Estrutura do projeto

```
cutucao-bot/
├── src/
│   ├── index.ts              # Entry point e client setup
│   ├── config.ts             # Validação de variáveis de ambiente
│   ├── database.ts           # SQLite com WAL e prepared statements
│   ├── commands/             # Slash commands (/template, /status, etc.)
│   ├── events/               # Handlers de eventos do Discord
│   ├── jobs/                 # Jobs agendados (lembrete, cobrança, resumo)
│   └── utils/                # Helpers (validação, sanitização, rate limit)
├── assets/                   # Logo e recursos visuais
├── config.json               # Configuração do servidor (categorias, prefixos, horários)
├── config.example.json       # Referência documentada de todos os campos
├── SPEC.md                   # Especificação técnica completa
├── .env.example              # Template de variáveis de ambiente
└── package.json
```

## Estrutura esperada do servidor Discord

O cutuCÃO espera encontrar no servidor:

- Uma **categoria** chamada **"Orientações"** contendo canais privados com prefixo `phd-`, `msc-` ou `bsc-` (ex: `#msc-natasha-romanoff`)
- Um canal chamado **`#boas-vindas-e-regras`** para mensagens de boas-vindas
- O cargo do bot com permissão de **Ver Canal**, **Enviar Mensagens** e **Ler Histórico de Mensagens** na categoria Orientações

## Como o cutuCÃO funciona

O bot depende de convenções específicas no servidor Discord. Sem elas, ele não encontra os canais e não funciona.

### Premissa: categoria e nomenclatura

Por padrão, o bot monitora uma **categoria** chamada **"Orientações"**. O nome (e a quantidade) das categorias monitoradas são configuráveis no `config.json` — cada grupo pode usar o nome que preferir. Dentro de cada categoria monitorada, cada orientando tem um canal privado com nome no formato `<nível>-<nome>`:

```
📁 Orientações
   🔒 #phd-jack-bauer
   🔒 #msc-natasha-romanoff
   🔒 #bsc-harry-potter
```

Os prefixos padrão são `phd-` (doutorado), `msc-` (mestrado) e `bsc-` (graduação/TCC). Os prefixos também são configuráveis via `config.json`. Canais sem um prefixo configurado são ignorados. Novos canais criados nessa categoria são detectados automaticamente.

### Ciclo semanal

| Dia             | Horário | O que acontece                                          |
| --------------- | ------- | ------------------------------------------------------- |
| Segunda         | 09:00   | Lembrete com template de check-in em cada canal         |
| Segunda–Domingo | —       | Qualquer mensagem do aluno no canal conta como check-in |
| Quarta          | 09:00   | Cobrança gentil nos canais sem check-in                 |
| Sexta           | 18:00   | Resumo semanal por DM ao orientador                     |

### Detecção de check-in

Qualquer mensagem do aluno (não do bot) no seu canal durante a semana conta como check-in. O bot detecta **atividade**, não exige formato. O template é uma sugestão, não uma obrigação técnica.

Para detalhes completos sobre configuração, troubleshooting e operação, consulte o [Guia Operacional](docs/guia-operacional.md).

## Segurança

O cutuCÃO lida com dados de alunos reais e foi projetado com segurança como prioridade:

- **Menor privilégio** — O bot solicita apenas 4 permissões no Discord. Nunca Administrator.
- **Guild único** — O bot recusa operar em qualquer servidor que não seja o configurado.
- **Sem dados pessoais** — O banco armazena apenas IDs de canais, nomes de canais e flags de check-in. Nunca armazena conteúdo de mensagens.
- **Sanitização** — Toda entrada de usuário é validada e sanitizada antes do uso.
- **Rate limiting** — Limites internos evitam que bugs causem spam de mensagens.
- **Circuit breaker** — Jobs que falham repetidamente são desabilitados temporariamente.
- **Retenção total** — Histórico mantido indefinidamente; sem deleção automática.
- **Prepared statements** — Todas as queries SQL usam prepared statements.

Consulte a [seção 9 da SPEC.md](SPEC.md) para detalhes completos.

## Deploy

O cutuCÃO roda em produção no [Railway](https://railway.app):

1. Conecte o repositório GitHub ao Railway
2. Configure as variáveis de ambiente no dashboard (nunca no código)
3. Adicione um volume montado em `/app/data` para persistência do SQLite
4. O deploy acontece automaticamente a cada push na `main`

Outras opções de hospedagem: Fly.io, Oracle Cloud Free Tier, ou qualquer VPS com Node.js.

## Contribuindo

Contribuições são bem-vindas! Se você é aluno do ASSERT Lab ou de outro grupo de pesquisa interessado em usar o cutuCÃO:

### Como contribuir

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feat/minha-feature`)
3. Commite suas mudanças (`git commit -m "feat: descrição da mudança"`)
4. Faça push para a branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

### Convenções de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` alteração de documentação
- `chore:` tarefas de manutenção
- `refactor:` refatoração sem mudança de comportamento
- `security:` correção ou melhoria de segurança

### Regras importantes

- **Nunca** commite credenciais, tokens ou IDs reais
- Rode `npm run typecheck` antes de abrir um PR
- Rode `npm audit` e corrija vulnerabilidades de severidade alta
- Comandos restritos ao orientador devem sempre verificar `ORIENTADOR_ID` e usar respostas ephemeral
- Toda query SQL deve usar prepared statements

## Roadmap

- [x] **v1.0.0** — Lembretes, cobrança, resumo semanal, boas-vindas, comandos básicos
- [x] **v1.2.0** — Configuração por arquivo (`config.json`): categorias, prefixos, horários, escalação
- [ ] Comandos `/config` para configuração em tempo real (sem reiniciar o bot)
- [ ] Dashboard web para visualização de status
- [ ] Integração com Google Calendar
- [ ] Notificação de marcos/deadlines (qualificação, defesa)
- [ ] Métricas de longo prazo (taxa de adesão por mês)

## Adaptando para seu grupo de pesquisa

O cutuCÃO foi criado para o ASSERT Lab, mas pode ser adaptado para qualquer grupo de pesquisa. Para usar no seu servidor:

1. Clone o repositório
2. Crie uma aplicação de bot no Discord Developer Portal
3. Configure o servidor Discord com uma categoria e canais com prefixo correspondente
4. Preencha o `.env` com os dados do seu servidor
5. Copie `config.example.json` para `config.json` e ajuste categorias, prefixos, horários e demais configurações
6. Faça deploy

O bot detecta canais automaticamente — sem alterar código. Consulte o `config.example.json` para todas as opções de customização.

## Licença

[MIT](LICENSE) — Use, modifique e distribua livremente.

## Créditos

Desenvolvido por [Vinicius Garcia](https://github.com/vinicius3w) e o [ASSERT Lab](https://assertlab.github.io/) do Centro de Informática da UFPE.

O cutuCÃO foi concebido, especificado e desenvolvido com o apoio do [Claude](https://claude.ai) (Anthropic) e [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

---

<p align="center">
  <em>Porque travar não é problema. Silêncio é.</em> 🐕
</p>
