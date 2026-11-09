## Descrição

<!-- O que este PR faz e por quê? Descreva o problema que ele resolve. -->

Closes #

## Tipo de mudança

<!-- Marque com [x] o que se aplica. -->

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `docs` — documentação
- [ ] `test` — testes
- [ ] `refactor` — refatoração sem mudança de comportamento
- [ ] `chore` — manutenção (dependências, build, CI)
- [ ] `security` — correção ou melhoria de segurança

## Como testar

<!-- Passos para quem for revisar reproduzir e validar a mudança. Ex.: comando a executar no servidor de testes, job a disparar com /teste-lembrete etc. -->

1.
2.

## Capturas de tela

<!-- Se a mudança altera mensagens enviadas no Discord, inclua um print. Remova nomes e IDs reais de alunos. Apague esta seção se não se aplicar. -->

## Checklist

- [ ] Li o [guia de contribuição](https://github.com/assertlab/cutucao-bot/blob/main/CONTRIBUTING.md)
- [ ] Os commits seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- [ ] `npm run typecheck` passa sem erros
- [ ] `npm test` passa
- [ ] `npm run build` passa
- [ ] `npm audit` não aponta vulnerabilidades altas novas (ou justifiquei abaixo)
- [ ] Adicionei ou atualizei testes que cobrem a mudança
- [ ] Atualizei a documentação (README, SPEC.md, `docs/`, `config.example.json`), se necessário

### Segurança e privacidade

- [ ] Nenhuma credencial, token, ID real ou arquivo `.env`/`.db` foi commitado
- [ ] Toda query SQL nova usa prepared statements
- [ ] Comandos restritos ao orientador verificam `ORIENTADOR_ID` e respondem de forma *ephemeral*
- [ ] O bot continua sem armazenar conteúdo de mensagens dos alunos
- [ ] Não foram adicionadas novas permissões do Discord (ou justifiquei abaixo)

## Observações para a revisão

<!-- Algo que mereça atenção especial, decisões de design, pontos em aberto. -->
