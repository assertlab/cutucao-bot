# Migração do cutuCÃO — Railway → Oracle Cloud Free Tier

## Por que migrar?

O Railway não permite bots/mirrors em sua plataforma e deixou de oferecer plano gratuito. O Oracle Cloud Free Tier oferece instâncias de computação permanentemente gratuitas (não é trial), com 200 GB de disco e 10 TB/mês de banda de saída.

O ideal seria uma instância ARM (VM.Standard.A1.Flex), que chega a 4 OCPUs e 24 GB de RAM, mas ela costuma estar sem capacidade nas regiões e frequentemente não pode ser criada. Na prática, a migração foi feita em uma instância AMD **VM.Standard.E2.1.Micro** (1 OCPU, 1 GB de RAM), que tem mais disponibilidade e é suficiente para o cutuCÃO: o bot consome menos de 30 MB em operação normal. Este guia usa a AMD Micro.

---

## Etapa 1: Criar conta no Oracle Cloud

1. Acesse https://www.oracle.com/cloud/free/
2. Clique em **"Start for free"**
3. Preencha com seus dados reais (a Oracle valida identidade)
4. **Cartão de crédito:** será necessário para verificação. A Oracle faz uma autorização temporária (~$1) que é estornada. Você **não será cobrado** enquanto usar apenas recursos do Free Tier.
5. **Região:** escolha a mais próxima de você. Para Recife, **Brazil East (São Paulo)** é a melhor opção. A região não pode ser alterada depois.
6. Aguarde a aprovação (pode levar de minutos a dias)

**Nota importante:** A Oracle pode rejeitar contas. Se isso acontecer, tente novamente com outro e-mail após alguns dias, ou considere o Fly.io como plano B.

7. Após aprovação, habilite **2FA** na conta Oracle (Security → Multi-Factor Authentication)

---

## Etapa 2: Criar a instância (VM)

### 2.1. Acessar o console

1. Faça login em https://cloud.oracle.com
2. No menu hambúrguer (☰) → **Compute** → **Instances**
3. Clique em **"Create Instance"**

### 2.2. Configurar a instância

**Name:** `cutucao-bot`

**Image:** Ubuntu 24.04 (Canonical)

**Shape:**

- Clique em **"Change shape"**
- Selecione **"Specialty and previous generation"** → **"VM.Standard.E2.1.Micro"** (AMD, 1 OCPU, 1 GB de RAM)
- Este é o shape usado neste guia, por ter mais disponibilidade

Sobre a ARM (opcional): a família **"Ampere"** / **"VM.Standard.A1.Flex"** oferece mais recursos (até 4 OCPUs e 24 GB de RAM), mas costuma retornar erro de "out of capacity" na criação. Se quiser tentar, selecione Ampere e configure OCPUs/Memory; se falhar, volte para a AMD Micro. O restante deste guia funciona igual nas duas.

**Networking:**

- Selecione "Create new virtual cloud network"
- Selecione "Create new public subnet"
- Marque **"Assign a public IPv4 address"**

**SSH Key:**

- Selecione **"Generate a key pair for me"**
- **Baixe a chave privada** (.key) e a chave pública — salve em local seguro
- Você precisará da chave privada para conectar via SSH

### 2.3. Criar a instância

- Clique em **"Create"**
- Aguarde o estado mudar para **"Running"**
- Anote o **Public IP Address** que aparece nos detalhes da instância

---

## Etapa 3: Configurar o firewall do Oracle Cloud

O Oracle Cloud tem um firewall na camada de rede (Security Lists) que bloqueia tudo por padrão. O cutuCÃO não precisa de portas abertas (ele se conecta ao Discord via WebSocket de saída), mas é bom garantir que o tráfego de saída está liberado.

1. Vá em **Networking** → **Virtual Cloud Networks** → selecione sua VCN
2. Clique na **subnet** → clique na **Security List**
3. Verifique que existe uma regra de **Egress** permitindo **All Protocols** para **0.0.0.0/0** (saída irrestrita)
4. Para SSH, verifique que existe uma regra de **Ingress** para porta **22** TCP de **0.0.0.0/0** (ou do seu IP específico, para mais segurança)

---

## Etapa 4: Conectar via SSH e preparar o servidor

### 4.1. Conectar

```bash
# Ajuste as permissões da chave
chmod 400 ~/Downloads/ssh-key-cutucao.key

# Conecte (substitua pelo IP da sua instância)
ssh -i ~/Downloads/ssh-key-cutucao.key ubuntu@SEU_IP_PUBLICO
```

### 4.2. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 4.3. Instalar Node.js 20

```bash
# Instalar via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version   # deve mostrar v20.x
npm --version
```

### 4.4. Instalar Git

```bash
sudo apt install -y git
```

### 4.5. Instalar dependências de compilação

O `better-sqlite3` precisa compilar código nativo:

```bash
sudo apt install -y build-essential python3
```

### 4.6. Criar swap

Com apenas 1 GB de RAM na AMD Micro, o swap evita que o `npm install` seja morto por falta de memória:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Etapa 5: Deploy do cutuCÃO

### 5.1. Clonar o repositório

```bash
cd ~
git clone https://github.com/assertlab/cutucao-bot.git
cd cutucao-bot
```

### 5.2. Instalar dependências

```bash
npm install
```

Se der erro no `better-sqlite3` na compilação do módulo nativo, tente:

```bash
npm rebuild better-sqlite3
```

Se o processo for morto por falta de memória, confirme que o swap da etapa 4.6 está ativo (`free -h`).

### 5.3. Configurar variáveis de ambiente

```bash
nano .env
```

Conteúdo:

```env
DISCORD_TOKEN=seu_token_aqui
GUILD_ID=seu_guild_id_aqui
ORIENTADOR_ID=seu_orientador_id_aqui
DATABASE_PATH=./data/cutucao.db
TZ=America/Recife
```

Salve com Ctrl+O, Enter, Ctrl+X.

### 5.4. Configurar o config.json

```bash
cp config.example.json config.json
nano config.json
```

Ajuste as categorias, prefixos e horários conforme seu servidor. Salve.

### 5.5. Compilar

```bash
npm run build
```

### 5.6. Criar a pasta de dados

```bash
mkdir -p data
```

### 5.7. Testar manualmente

```bash
npm start
```

Verifique no Discord se o cutuCÃO aparece online. Teste o `/ajuda`. Se funcionar, pare com Ctrl+C.

---

## Etapa 6: Configurar como serviço (systemd)

Para que o cutuCÃO rode 24/7 e reinicie automaticamente em caso de crash ou reboot:

### 6.1. Criar o arquivo de serviço

```bash
sudo nano /etc/systemd/system/cutucao.service
```

Conteúdo:

```ini
[Unit]
Description=cutuCÃO Discord Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/cutucao-bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Variáveis de ambiente
EnvironmentFile=/home/ubuntu/cutucao-bot/.env

# Segurança
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/ubuntu/cutucao-bot/data

[Install]
WantedBy=multi-user.target
```

### 6.2. Habilitar e iniciar o serviço

```bash
# Recarregar configurações do systemd
sudo systemctl daemon-reload

# Habilitar para iniciar no boot
sudo systemctl enable cutucao

# Iniciar agora
sudo systemctl start cutucao

# Verificar status
sudo systemctl status cutucao
```

### 6.3. Verificar logs

```bash
# Logs em tempo real
sudo journalctl -u cutucao -f

# Últimas 50 linhas
sudo journalctl -u cutucao -n 50
```

Deve aparecer: `🐕 Logado como cutuCÃO#8175`

---

## Etapa 7: Configurar deploy automático (opcional)

Para atualizar o cutuCÃO quando houver push no GitHub, crie um script de atualização:

```bash
nano ~/update-cutucao.sh
```

Conteúdo:

```bash
#!/bin/bash
cd /home/ubuntu/cutucao-bot
git pull
npm install
npm run build
sudo systemctl restart cutucao
echo "🐕 cutuCÃO atualizado e reiniciado!"
```

```bash
chmod +x ~/update-cutucao.sh
```

Para atualizar, basta rodar:

```bash
~/update-cutucao.sh
```

Para deploy totalmente automático via GitHub Actions (CI/CD), seria necessário configurar SSH keys no GitHub Secrets e um workflow que faz SSH no servidor. Isso pode ser implementado depois.

---

## Etapa 8: Migrar dados do Railway (opcional)

Se quiser manter o histórico de check-ins do Railway:

1. Antes de desligar o Railway, use o comando `/exportar` com escopo "tudo" no Discord
2. Salve o JSON exportado
3. No Oracle Cloud, você pode importar os dados via um script ou começar do zero (o histórico é recente, poucos dias)

---

## Etapa 9: Desligar o Railway

Após confirmar que o cutuCÃO está rodando no Oracle Cloud:

1. Verifique que o bot está online no Discord (via Oracle, não Railway)
2. No Railway dashboard, vá em Settings do serviço → **"Delete Service"**
3. Se não pretende usar mais o Railway, pode deletar o projeto inteiro

---

## Etapa 10: Evitar reclamação de instância ociosa

A Oracle pode reclamar (desligar) instâncias Always Free que considerar ociosas. Para evitar isso:

- O cutuCÃO por si só já mantém a instância ativa (processo rodando 24/7, conexões WebSocket)
- Monitore e-mails da Oracle — eles enviam aviso antes de reclamar
- Se quiser garantia extra, crie um cron job simples que gera atividade mínima de CPU:

```bash
# Adicionar ao crontab (crontab -e)
*/30 * * * * /usr/bin/uptime >> /dev/null 2>&1
```

---

## Manutenção do servidor

### Atualizar o sistema operacional

```bash
sudo apt update && sudo apt upgrade -y
```

Faça isso pelo menos uma vez por mês.

### Reiniciar o bot

```bash
sudo systemctl restart cutucao
```

### Parar o bot

```bash
sudo systemctl stop cutucao
```

### Ver logs de erro

```bash
sudo journalctl -u cutucao --since "1 hour ago" --priority err
```

### Verificar uso de disco

```bash
df -h
du -sh ~/cutucao-bot/data/
```

---

## Resumo: Railway vs Oracle Cloud

|Aspecto|Railway|Oracle Cloud Free Tier|
|---|---|---|
|Custo|Trial limitado|Gratuito permanente|
|Deploy|Git push automático|Manual (script) ou SSH|
|Disco persistente|Volume pago|200 GB incluso|
|RAM|~512 MB|1 GB (AMD Micro; ARM chega a 24 GB quando há capacidade)|
|Bots permitidos|Não|Sim|
|Setup|5 minutos|30-60 minutos|
|Manutenção|Zero|Baixa (updates do OS)|
|Controle|Limitado (PaaS)|Total (VM Linux)|
