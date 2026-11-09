# Contribuindo com o cutuCÃO 🐕

Que bom que você quer ajudar o vira-lata caramelo! Este guia explica como propor mudanças, reportar problemas e abrir Pull Requests no cutuCÃO.

Ao participar deste projeto, você concorda em seguir o nosso [Código de Conduta](CODE_OF_CONDUCT.md).

## Sumário

- [Formas de contribuir](#formas-de-contribuir)
- [Antes de começar](#antes-de-começar)
- [Preparando o ambiente](#preparando-o-ambiente)
- [Fluxo de trabalho](#fluxo-de-trabalho)
- [Convenções de commit](#convenções-de-commit)
- [Padrões de código](#padrões-de-código)
- [Testes](#testes)
- [Abrindo um Pull Request](#abrindo-um-pull-request)
- [Reportando bugs e sugerindo funcionalidades](#reportando-bugs-e-sugerindo-funcionalidades)
- [Questões de segurança](#questões-de-segurança)
- [Dúvidas](#dúvidas)

## Formas de contribuir

Nem toda contribuição é código. Você pode:

- **Reportar bugs** pelo template de issue de bug.
- **Sugerir funcionalidades** ou melhorias (veja o [Roadmap no README](README.md#roadmap)).
- **Melhorar a documentação**: README, [SPEC.md](SPEC.md) e os guias em [`docs/`](docs/).
- **Revisar Pull Requests** abertos por outras pessoas.
- **Escrever testes** para partes do código ainda pouco cobertas.
- **Adaptar o bot para o seu grupo de pesquisa** e contar como foi; isso ajuda a descobrir o que ainda está acoplado ao ASSERT Lab.

Se é a sua primeira contribuição, procure issues marcadas com `good first issue`.

## Antes de começar

1. **Procure se já existe uma issue** sobre o assunto. Se existir, comente nela em vez de abrir outra.
2. **Para mudanças grandes** (nova funcionalidade, mudança de comportamento dos jobs, alteração no esquema do banco), abra uma issue primeiro e discuta a proposta. Assim ninguém perde tempo com um PR que não será aceito.
3. **Leia a [SPEC.md](SPEC.md)**, em especial a seção 9 (Segurança). O cutuCÃO lida com dados de alunos reais e algumas regras não são negociáveis.

## Preparando o ambiente

Pré-requisitos: [Node.js](https://nodejs.org/) 24 ou superior e [Git](https://git-scm.com/).

```bash
# 1. Faça um fork pelo GitHub e clone o seu fork
git clone https://github.com/<seu-usuario>/cutucao-bot.git
cd cutucao-bot

# 2. Adicione o repositório original como upstream
git remote add upstream https://github.com/assertlab/cutucao-bot.git

# 3. Instale as dependências
npm install

# 4. Configure o ambiente de desenvolvimento
cp .env.example .env.dev
cp config.example.json config.json
```

Preencha o `.env.dev` com os dados de um **servidor Discord de testes** (nunca use o servidor de produção do laboratório para desenvolver). O passo a passo para criar o bot e obter os IDs está no [README](README.md#setup) e no [Guia Operacional](docs/guia-operacional.md).

Para rodar localmente:

```bash
npm run dev
```

## Fluxo de trabalho

1. Atualize a sua `main` com o upstream:

   ```bash
   git checkout main
   git pull upstream main
   ```

2. Crie uma branch descritiva, usando o mesmo prefixo dos commits:

   ```bash
   git checkout -b feat/comando-config
   git checkout -b fix/cobranca-fuso-horario
   git checkout -b docs/guia-deploy
   ```

3. Faça commits pequenos e focados.
4. Rode as verificações locais (veja [Testes](#testes)).
5. Faça push e abra o Pull Request para a branch `main`.

## Convenções de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

| Prefixo     | Uso                                           |
| ----------- | --------------------------------------------- |
| `feat:`     | nova funcionalidade                           |
| `fix:`      | correção de bug                               |
| `docs:`     | alteração de documentação                     |
| `test:`     | adição ou ajuste de testes                    |
| `refactor:` | refatoração sem mudança de comportamento      |
| `chore:`    | manutenção (dependências, build, CI)          |
| `security:` | correção ou melhoria de segurança             |

Exemplos:

```
feat: adiciona comando /config para alterar horários em tempo real
fix: corrige contagem de semanas inativas na virada do ano
docs: explica configuração de múltiplas categorias no guia operacional
```

Escreva a mensagem no imperativo e em português, como nos exemplos.

## Padrões de código

- **TypeScript estrito.** O código precisa passar em `npm run typecheck` sem erros.
- **Mensagens ao usuário ficam em `src/mensagens/templates.json`**, não espalhadas pelo código.
- **Acesso ao banco passa pelos repositórios** em `src/repositories/` (padrão Repository).
- **Toda query SQL usa prepared statements.** Nunca concatene strings em SQL.
- **Comandos restritos ao orientador** devem verificar `ORIENTADOR_ID` e responder de forma *ephemeral*.
- **Nunca armazene conteúdo de mensagens** dos alunos. O banco guarda apenas IDs, nomes de canais e flags de check-in.
- **Entradas de usuário** devem ser validadas e sanitizadas (veja `src/utils/validacao.ts`).
- **Novas permissões do Discord** só com justificativa clara no PR. O bot segue o princípio do menor privilégio e nunca pede Administrator.
- **Nunca commite credenciais**: tokens, IDs reais, `.env`, `config.json` do servidor de produção ou o arquivo `.db`.

## Testes

Os testes usam [Vitest](https://vitest.dev/) e ficam em `src/__tests__/`. Antes de abrir um PR, rode:

```bash
npm run typecheck   # verificação de tipos
npm test            # testes automatizados
npm run build       # compilação
npm audit           # vulnerabilidades em dependências
```

Os três primeiros também rodam na CI (GitHub Actions) em todo PR. Vulnerabilidades de severidade alta apontadas pelo `npm audit` devem ser corrigidas ou justificadas no PR.

Se você corrigiu um bug, inclua um teste que falharia sem a correção. Se adicionou uma funcionalidade, inclua testes que cubram o comportamento principal.

## Abrindo um Pull Request

- Preencha o template de PR que aparece automaticamente.
- Referencie a issue relacionada (`Closes #123`).
- Mantenha o PR focado em um único assunto. PRs menores são revisados mais rápido.
- Atualize a documentação (README, SPEC.md, `docs/`, `config.example.json`) se a mudança afetar comportamento, configuração ou comandos.
- Se a mudança alterar mensagens enviadas no Discord, inclua um print no PR.
- Aguarde a revisão de pelo menos um mantenedor. Responda aos comentários com novos commits; não force push depois que a revisão começou, para não perder o histórico da discussão.

## Reportando bugs e sugerindo funcionalidades

Use os templates disponíveis em **Issues → New issue**:

- **🐛 Reportar bug**: descreva o que aconteceu, o que esperava e como reproduzir. Inclua versão do bot, versão do Node.js e trechos relevantes do log.
- **✨ Sugerir funcionalidade**: descreva o problema que a ideia resolve, não só a solução.

**Antes de colar logs, remova tokens, IDs de servidor/usuário e nomes de alunos.**

## Questões de segurança

Se você encontrou uma vulnerabilidade (vazamento de token, bypass da verificação de orientador, injeção de SQL etc.), **não abra uma issue pública**. Entre em contato diretamente com os mantenedores pelo e-mail informado no [Código de Conduta](CODE_OF_CONDUCT.md#aplicação) ou pelo recurso *Report a vulnerability* do GitHub, na aba **Security** do repositório.

## Dúvidas

Abra uma issue com a sua pergunta ou fale com a equipe do [ASSERT Lab](https://assertlab.github.io/). Não existe pergunta boba; se algo não está claro, provavelmente a documentação precisa melhorar, e isso já é uma contribuição.

Obrigado por ajudar o cutuCÃO a cuidar melhor dos orientandos! 🐕
