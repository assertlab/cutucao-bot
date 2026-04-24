# Guia Operacional do cutuCÃO

Este documento descreve todas as premissas, convenções e configurações que o cutuCÃO espera encontrar para funcionar corretamente. Leia antes de configurar uma nova instância ou contribuir com o projeto.

---

## 1. Premissas do servidor Discord

O cutuCÃO não é um bot genérico — ele foi projetado para um contexto específico: acompanhamento de orientandos em grupos de pesquisa acadêmica. Para funcionar, ele depende de uma estrutura de servidor Discord que siga convenções de nomenclatura e organização.

### 1.1. Categoria "Orientações"

O bot busca **por nome** uma categoria chamada exatamente **"Orientações"** (com acento). Todos os canais de orientação individual devem estar dentro desta categoria.

Se a categoria não existir ou tiver nome diferente, o bot não encontra os canais e não envia lembretes. O log de inicialização mostra se a detecção foi bem-sucedida:

```
🐕 Categoria "Orientações" detectada com 16 canal(is) de orientação.
```

### 1.2. Convenção de nomenclatura dos canais

Dentro da categoria "Orientações", o bot monitora **apenas** canais cujo nome segue o padrão:

```
<nível>-<nome-do-aluno>
```

Onde `<nível>` é um dos três prefixos obrigatórios:

| Prefixo | Significado     | Exemplo                 |
| ------- | --------------- | ----------------------- |
| `phd-`  | Doutorado       | `#phd-jack-bauer` |
| `msc-`  | Mestrado        | `#msc-natasha-romanoff`  |
| `bsc-`  | Graduação (TCC) | `#bsc-harry-potter`  |

**Regras do nome:**

- Tudo em minúsculas (requisito do Discord)
- Palavras separadas por hífen (requisito do Discord)
- O prefixo determina o nível exibido nos relatórios
- Canais sem esses prefixos na categoria são ignorados silenciosamente

**Exemplos válidos:**

```
#phd-jack-bauer         ✅
#msc-natasha-romanoff   ✅
#bsc-harry-potter       ✅
```

**Exemplos inválidos (ignorados pelo bot):**

```
#mestrado-natasha           ❌ (prefixo errado)
#msc_natasha_romanoff      ❌ (underscore em vez de hífen — Discord não permite de qualquer forma)
#orientacao-geral         ❌ (sem prefixo de nível)
```

### 1.3. Canal de boas-vindas

O bot busca **por nome** um canal chamado exatamente **`boas-vindas-e-regras`** para enviar mensagens de boas-vindas a novos membros. Se o canal não existir, a funcionalidade de boas-vindas é desativada silenciosamente (sem erro).

### 1.4. Permissões do bot

O cargo do cutuCÃO precisa ter as seguintes permissões **na categoria "Orientações"**:

| Permissão                                         | Motivo                                   |
| ------------------------------------------------- | ---------------------------------------- |
| Ver Canal (View Channel)                          | Listar e acessar os canais de orientação |
| Enviar Mensagens (Send Messages)                  | Postar lembretes e cobranças             |
| Ler Histórico de Mensagens (Read Message History) | Verificar se houve check-in              |

Essas permissões devem ser configuradas **na categoria** (não em cada canal individual), para que novos canais herdem automaticamente.

O bot **não precisa e não deve ter** permissão de Administrator, Manage Channels, Manage Roles, Ban Members, ou Kick Members.

### 1.5. Canais privados

Os canais de orientação são tipicamente configurados como **privados** (apenas o aluno, o orientador e o bot têm acesso). Isso é uma decisão do administrador do servidor, não um requisito do bot. O bot funciona igualmente em canais públicos ou privados, desde que tenha as permissões da seção 1.4.

---

## 2. Como o bot detecta canais

Na inicialização e durante a execução, o bot usa a seguinte lógica:

```
1. Buscar todas as categorias do servidor
2. Encontrar a categoria cujo nome é "Orientações" (case-sensitive)
3. Listar os canais de texto dentro dessa categoria
4. Filtrar apenas os que começam com "phd-", "msc-" ou "bsc-"
5. Extrair o nível (phd/msc/bsc) e o nome do aluno do nome do canal
```

**Detecção automática de novos canais:** Quando um novo canal é criado na categoria "Orientações" com um prefixo válido, o bot detecta automaticamente via o evento `channelCreate` do Discord — sem necessidade de reiniciar ou reconfigurar.

**Nome do aluno nos relatórios:** O bot converte o nome do canal em nome legível:

- `msc-natasha-romanoff` → "Natasha Romanoff (msc)"
- `phd-harry-potter` → "Harry Potter (phd)"

A conversão capitaliza cada palavra e remove o prefixo de nível.

---

## 3. Como o check-in funciona

### 3.1. O que conta como check-in

**Qualquer mensagem** enviada pelo aluno (não pelo bot ou outro bot) no seu canal de orientação durante a semana é registrada como check-in. O bot não exige formato específico — a detecção é por atividade, não por conteúdo.

- A semana vai de segunda-feira 00:00 a domingo 23:59 (fuso `America/Recife`).
- Apenas a **primeira mensagem** da semana é registrada. Mensagens subsequentes não geram registros duplicados.
- Mensagens de bots são ignoradas.
- Mensagens fora dos canais monitorados são ignoradas.

### 3.2. Ciclo semanal

| Dia               | Horário | Ação                                                          |
| ----------------- | ------- | ------------------------------------------------------------- |
| Segunda           | 09:00   | Bot envia **lembrete** com template de check-in em cada canal |
| Segunda a domingo | —       | Bot **detecta** mensagens dos alunos como check-in            |
| Quarta            | 09:00   | Bot envia **cobrança gentil** nos canais sem check-in         |
| Sexta             | 18:00   | Bot envia **resumo semanal** por DM ao orientador             |

### 3.3. Escalação por inatividade

O bot rastreia semanas consecutivas sem check-in:

| Semanas sem check-in | Ação do bot                       |
| -------------------- | --------------------------------- |
| 1 semana             | Cobrança gentil no canal (quarta) |
| 2+ semanas           | Notificação por DM ao orientador  |
| 3+ semanas           | Marcado com ⚠️ no resumo semanal  |

O bot nunca pune ou restringe o aluno — ele apenas torna a inatividade visível.

---

## 4. config.json — configuração por arquivo

O arquivo `config.json` na raiz do projeto complementa as variáveis de ambiente, permitindo customizar o comportamento do bot **sem alterar código**. Diferente do `.env`, o `config.json` é versionado no Git: cada instância mantém seu próprio arquivo com os valores corretos para o servidor.

Se o arquivo não existir, o bot inicia com valores padrão (retrocompatibilidade total).

### 4.1. Estrutura do config.json

```json
{
  "categorias": ["Orientações"],
  "prefixos": {
    "phd": "Doutorado",
    "msc": "Mestrado",
    "bsc": "Graduação"
  },
  "canal_boas_vindas": "boas-vindas-e-regras",
  "horarios": {
    "lembrete": "0 9 * * 1",
    "cobranca": "0 9 * * 3",
    "resumo": "0 18 * * 5"
  },
  "escalacao": {
    "semanas_para_cobranca_dm": 2,
    "semanas_para_alerta": 3
  },
  "visualizacao": {
    "semanas_historico_padrao": 4,
    "meses_resumo_padrao": 6
  }
}
```

### 4.2. Descrição dos campos

| Campo | Padrão | Descrição |
| ----- | ------ | --------- |
| `categorias` | `["Orientações"]` | Lista de categorias Discord a monitorar. Pode ter múltiplas. |
| `prefixos` | `{phd, msc, bsc}` | Prefixo de canal → label nos relatórios. A chave é usada no nome do canal; o valor aparece nos relatórios. |
| `canal_boas_vindas` | `boas-vindas-e-regras` | Nome do canal (sem `#`) para mensagens de boas-vindas. |
| `horarios.lembrete` | `0 9 * * 1` | Cron: segunda 09:00 |
| `horarios.cobranca` | `0 9 * * 3` | Cron: quarta 09:00 |
| `horarios.resumo` | `0 18 * * 5` | Cron: sexta 18:00 |
| `escalacao.semanas_para_cobranca_dm` | `2` | Semanas de inatividade para enviar DM ao orientador |
| `escalacao.semanas_para_alerta` | `3` | Semanas de inatividade para exibir ⚠️ no resumo |
| `visualizacao.semanas_historico_padrao` | `4` | Semanas exibidas pelo `/resumo #canal` |
| `visualizacao.meses_resumo_padrao` | `6` | Reservado para filtro de visualização no dashboard futuro |

### 4.3. Exemplos de customização

**Múltiplas categorias (ex: Prof. Leopoldo com Orientações + Pesquisa):**
```json
{
  "categorias": ["Orientações", "Colaboradores externos"]
}
```

**Prefixos customizados com labels em português:**
```json
{
  "prefixos": {
    "phd": "Doutorado",
    "msc": "Mestrado",
    "bsc": "Iniciação Científica"
  }
}
```

**Horário de lembrete às 8h em vez de 9h:**
```json
{
  "horarios": {
    "lembrete": "0 8 * * 1"
  }
}
```

### 4.4. Validação

Se uma **cron expression** for inválida, o bot se recusa a iniciar e mostra mensagem de erro indicando qual campo está incorreto. Campos ausentes no `config.json` usam os valores padrão automaticamente.

Use `config.example.json` na raiz do repositório como referência documentada de todos os campos.

---

## 5. Variáveis de ambiente

| Variável        | Obrigatória | Descrição                                                              | Exemplo              |
| --------------- | ----------- | ---------------------------------------------------------------------- | -------------------- |
| `DISCORD_TOKEN` | Sim         | Token do bot (Discord Developer Portal → Bot → Reset Token)            | `MTQ5NjQ2...`        |
| `GUILD_ID`      | Sim         | ID do servidor Discord (botão direito no nome do servidor → Copiar ID) | `123456789012345678` |
| `ORIENTADOR_ID` | Sim         | ID do usuário que recebe resumos e acessa comandos restritos           | `987654321098765432` |
| `DATABASE_PATH` | Sim         | Caminho do arquivo SQLite                                              | `./data/base.db`  |
| `TZ`            | Sim         | Fuso horário para os agendamentos (formato IANA)                       | `America/Recife`     |

**Como obter IDs:** Ative o Modo de Desenvolvedor no Discord (Configurações → Avançado → Modo de Desenvolvedor). Depois, clique com botão direito em qualquer elemento para ver a opção "Copiar ID".

**Sobre o fuso horário:** O bot usa o fuso configurado em `TZ` para todos os agendamentos. Se seu grupo está em São Paulo, use `America/Sao_Paulo`. Em Manaus, `America/Manaus`. A lista completa está em https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.

---

## 6. Estrutura do banco de dados

O bot usa SQLite com WAL mode. O banco é criado automaticamente na primeira execução.

### Tabela: `checkins`

| Coluna                          | Tipo            | Descrição                                    |
| ------------------------------- | --------------- | -------------------------------------------- |
| `id`                            | INTEGER (PK)    | ID auto-incremento                           |
| `canalId`                       | TEXT            | ID do canal Discord                          |
| `nomeCanal`                     | TEXT            | Nome do canal (ex: "msc-natasha-romanoff")    |
| `nivel`                         | TEXT            | "phd", "msc" ou "bsc"                        |
| `semana`                        | TEXT            | Semana ISO (ex: "2026-W17")                  |
| `checkinRealizado`              | INTEGER         | 0 = não postou, 1 = postou                   |
| `dataCheckin`                   | TEXT (nullable) | ISO timestamp do primeiro check-in da semana |
| `semanasConsecutivasSemCheckin` | INTEGER         | Contador de inatividade consecutiva          |

**Índices:** `(semana, canalId)` para consultas rápidas por semana.

**Retenção:** O histórico é mantido indefinidamente. Use o campo `visualizacao.meses_resumo_padrao` em `config.json` para controle de visualização no dashboard futuro.

**O que NÃO é armazenado:** conteúdo de mensagens, IDs de usuários dos alunos, e-mails, ou qualquer dado pessoal além do nome do canal (que é público no servidor).

---

## 7. Configurando uma nova instância

Checklist completa para colocar o cutuCÃO no ar em um novo servidor:

### No Discord Developer Portal

- [ ] Criar uma nova aplicação em https://discord.com/developers/applications
- [ ] Ir em Bot → Reset Token → copiar e guardar o token
- [ ] Ativar Server Members Intent e Message Content Intent
- [ ] Em OAuth2 → URL Generator: marcar `bot` + `applications.commands`
- [ ] Permissões: apenas Send Messages, Read Message History, View Channels, Use Slash Commands
- [ ] Copiar a URL e adicionar o bot ao servidor

### No servidor Discord

- [ ] Criar uma categoria chamada exatamente **"Orientações"**
- [ ] Dentro dela, criar canais com prefixo `phd-`, `msc-` ou `bsc-` seguido do nome do aluno
- [ ] Configurar os canais como privados (opcional, mas recomendado)
- [ ] Nas permissões da categoria, adicionar o cargo do bot com Ver Canal, Enviar Mensagens e Ler Histórico
- [ ] Criar um canal `#boas-vindas-e-regras` (se quiser mensagens de boas-vindas)
- [ ] Ativar Modo de Desenvolvedor e copiar: ID do servidor e ID do orientador

### Na máquina de desenvolvimento

- [ ] Clonar o repositório
- [ ] Rodar `npm install`
- [ ] Criar o `.env` com as 5 variáveis
- [ ] (Opcional) Copiar `config.example.json` para `config.json` e ajustar
- [ ] Rodar `npm run build && npm start`
- [ ] Verificar que o log mostra: "Categoria 'Orientações' detectada com X canal(is)"
- [ ] Testar com `/teste-lembrete`

### Na hospedagem (Railway ou similar)

- [ ] Conectar o repositório
- [ ] Configurar as 5 variáveis de ambiente no dashboard
- [ ] Adicionar volume persistente para o SQLite
- [ ] Verificar nos logs que o bot logou com sucesso
- [ ] Parar a instância local

---

## 8. Adicionando um novo orientando

Quando um novo aluno entra no grupo:

1. Criar o canal na categoria "Orientações" com o padrão `nível-nome` (ex: `#msc-novo-aluno`)
2. Configurar permissões do canal: apenas o aluno, o orientador e o bot
3. O cutuCÃO detecta automaticamente — não precisa reiniciar
4. Na próxima segunda às 09:00, o aluno receberá o lembrete

## 9. Removendo um orientando

Quando um aluno defende ou sai do grupo:

1. O canal pode ser deletado ou movido para outra categoria (ex: "Alumni")
2. Se deletado, os registros de check-in permanecem no banco indefinidamente
3. Se movido para outra categoria, o bot para de monitorá-lo automaticamente

---

## 10. Troubleshooting

### O bot não encontra os canais

```
🐕 Categoria "Orientações" detectada com 0 canal(is) de orientação.
```

**Causas possíveis:**

- A categoria não se chama exatamente "Orientações" (verificar acento e capitalização)
- Os canais não têm prefixo `phd-`, `msc-` ou `bsc-`
- O bot não tem permissão de Ver Canal na categoria

### "Missing Access" ao enviar mensagens

```
❌ Falha ao processar item em lembrete Missing Access
```

**Causa:** O bot não tem permissão de Enviar Mensagens no canal. Solução: adicionar o cargo do bot nas permissões da categoria "Orientações" com Send Messages habilitado.

### Bot fica offline no Railway

Verificar nos logs do Railway se as variáveis de ambiente estão configuradas. O erro mais comum é `DISCORD_TOKEN` ausente ou inválido.

### Check-in não é detectado

O bot só detecta mensagens em canais que estão dentro da categoria "Orientações" e cujo nome segue o padrão. Mensagens do próprio bot ou de outros bots são ignoradas.

### O resumo semanal não chega

Verificar que `ORIENTADOR_ID` está correto e que o orientador permite receber DMs de membros do servidor (Configurações → Privacidade e Segurança → Mensagens Diretas de Membros do Servidor).
