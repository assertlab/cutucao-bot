# Política de Privacidade do cutuCÃO 🐕

**Última atualização:** 9 de novembro de 2026

Esta política explica quais dados o cutuCÃO (bot Discord do [ASSERT Lab](https://assertlab.github.io/), CIn-UFPE) trata, para quê, por quanto tempo e como você pode exercer seus direitos, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).

## 1. A quem esta política se aplica

Ela se aplica à instância do cutuCÃO operada pelo ASSERT Lab, no servidor Discord do laboratório. O cutuCÃO só funciona no servidor para o qual foi configurado e recusa operar em qualquer outro.

O código é aberto (licença MIT). Grupos que instalam a própria cópia do bot são responsáveis pelos dados tratados na sua instância e devem publicar a sua própria política.

## 2. Controlador e contato

- **Controlador:** Universidade Federal de Pernambuco (UFPE), por meio do ASSERT Lab, Centro de Informática (CIn-UFPE)
- **Responsável:** Prof. Vinicius Garcia
- **Contato para privacidade:** vcg@cin.ufpe.br

## 3. Quais dados tratamos

O cutuCÃO segue o princípio da **minimização de dados**. O banco de dados armazena apenas:

| Dado | Exemplo | Por que é necessário |
| --- | --- | --- |
| ID do canal de orientação | `123456789012345678` | Identificar onde verificar o check-in |
| Nome do canal de orientação | `msc-nome-sobrenome` | Exibir o relatório ao orientador |
| Nível da orientação | `phd`, `msc`, `bsc` | Agrupar o relatório |
| Semana | `2026-W45` | Organizar o histórico |
| Se houve check-in e quando | `sim`, `2026-11-04` | Acompanhar a regularidade da orientação |
| Semanas consecutivas sem check-in | `2` | Decidir quando avisar o orientador |

O nome do canal normalmente identifica o orientando. Por isso, junto com as datas de check-in, **é dado pessoal** e é tratado como tal.

**O cutuCÃO não armazena:**

- o conteúdo das mensagens (o bot não tem acesso ao texto: a permissão *Message Content* fica desativada);
- IDs de usuário dos alunos;
- e-mails, fotos de perfil, endereços IP ou qualquer outro dado da conta Discord.

Para funcionar, o bot recebe do Discord eventos de **nova mensagem** (só para saber que houve atividade no canal) e de **novo membro** (para enviar a mensagem de boas-vindas). Esses eventos são processados no momento e descartados.

O ID do usuário do orientador fica na configuração do servidor onde o bot roda (variável de ambiente), e não no banco de dados.

## 4. Finalidade e base legal

Os dados são usados **exclusivamente** para acompanhar a regularidade das orientações acadêmicas do laboratório: lembretes semanais, avisos a quem não fez check-in e o resumo semanal enviado ao orientador.

A base legal é o legítimo interesse do laboratório na condução das orientações (art. 7º, IX, da LGPD) e a execução de atividades acadêmicas da UFPE. Os dados não são usados para avaliação de desempenho, para fins comerciais nem para treinar modelos de inteligência artificial.

## 5. Quem tem acesso

- **Orientador:** é a única pessoa que vê relatórios, histórico e exportações. Os comandos de dados (`/status`, `/resumo`, `/uso`, `/exportar`, `/limpar`) só respondem ao orientador, com respostas visíveis apenas para ele, e as exportações são entregues por mensagem direta.
- **Hospedagem:** o bot roda em uma máquina virtual no Oracle Cloud, que atua como operadora de infraestrutura. O arquivo do banco tem acesso restrito ao processo do bot.
- **Discord:** as mensagens e os dados da sua conta são tratados pelo próprio Discord segundo a [Política de Privacidade do Discord](https://discord.com/privacy), que independe desta.

Os dados não são vendidos nem compartilhados com terceiros.

## 6. Retenção

O histórico é mantido enquanto a orientação estiver em andamento. Não há exclusão automática: ao fim de cada orientação, ou quando o prazo definido pelo laboratório for atingido, o orientador remove os registros com o comando `/limpar`, apagando também exportações e cópias de backup antigas.

## 7. Seus direitos

Como titular, você pode, a qualquer momento:

- confirmar se tratamos dados seus e ter acesso a eles;
- pedir a correção de dados incompletos ou incorretos;
- pedir a exclusão dos seus registros;
- obter informações sobre com quem os dados são compartilhados;
- se opor ao tratamento.

Para exercer qualquer desses direitos, escreva para **vcg@cin.ufpe.br**. Responderemos em até 15 dias. Você também pode apresentar reclamação à [Autoridade Nacional de Proteção de Dados (ANPD)](https://www.gov.br/anpd/).

## 8. Segurança

Entre as medidas adotadas estão: menor privilégio de permissões no Discord, operação em um único servidor, consultas ao banco feitas só com *prepared statements*, arquivos de dados com acesso restrito, logs sem conteúdo de mensagens nem tokens, e confirmação obrigatória antes de qualquer exclusão. Os detalhes técnicos estão na [seção 9 da especificação](https://github.com/assertlab/cutucao-bot/blob/main/SPEC.md).

Em caso de incidente que possa afetar seus dados, os membros do servidor serão avisados.

## 9. Alterações

Esta política pode ser atualizada quando o bot mudar. A versão vigente fica sempre neste arquivo, e o histórico de alterações pode ser consultado no Git. Mudanças relevantes serão anunciadas no servidor do laboratório.
