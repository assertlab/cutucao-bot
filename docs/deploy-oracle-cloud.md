# Deploy do cutuCÃO no Oracle Cloud Free Tier

Guia completo para implantar o cutuCÃO em uma instância gratuita permanente do Oracle Cloud Infrastructure (OCI).

---

## Por que Oracle Cloud?

O Oracle Cloud Free Tier oferece instâncias de computação permanentemente gratuitas (não é trial). Para o cutuCÃO, uma instância AMD Micro com 1 OCPU e 1 GB de RAM é suficiente. O bot consome menos de 30 MB de memória em operação normal.

Outras vantagens: 200 GB de disco, 10 TB/mês de banda de saída, e sem restrição contra bots.

---

## Pré-requisitos

- Conta no Oracle Cloud (https://www.oracle.com/cloud/free/)
- Cartão de crédito para verificação (não é cobrado no Free Tier)
- Token do bot Discord e IDs do servidor (mesmos do `.env`)
- Repositório do cutuCÃO (https://github.com/assertlab/cutucao-bot)

---

## 1. Criar conta no Oracle Cloud

1. Acesse https://www.oracle.com/cloud/free/ → **"Start for free"**
2. Preencha com dados reais (a Oracle valida identidade)
3. O cartão de crédito sofre uma autorização temporária (~$1) que é estornada
4. **Região:** escolha a mais próxima. Para o Nordeste do Brasil, **Brazil East (São Paulo)** é a melhor opção. A região não pode ser alterada depois.
5. Aguarde aprovação (pode levar de minutos a dias)
6. Após aprovação, habilite **2FA** na conta (Identity → Security → MFA)

A Oracle pode rejeitar contas na primeira tentativa. Se acontecer, tente novamente após alguns dias com outro e-mail.

---

## 2. Criar a instância

1. Faça login em https://cloud.oracle.com
2. Menu ☰ → **Compute** → **Instances** → **"Create Instance"**

### Configurações

| Campo | Valor |
|---|---|
| Name | `cutucao-bot` |
| Image | Ubuntu 24.04 (Canonical) |
| Shape | **VM.Standard.E2.1.Micro** (1 OCPU, 1 GB RAM) |
| Networking | Create new VCN + Create new public subnet |
| Public IP | Ativar "Automatically assign public IPv4 address" |
| SSH Key | "Generate a key pair for me" |

**Sobre o shape:** A instância ARM (VM.Standard.A1.Flex) oferece mais recursos (até 4 OCPUs e 24 GB RAM), mas frequentemente está sem capacidade. A AMD Micro (E2.1.Micro) tem mais disponibilidade e é suficiente para o cutuCÃO.

**Sobre o IP público:** Se o toggle de IP público não ativar durante a criação, prossiga sem ele e atribua depois:
- Após a instância estar Running, vá em **Attached VNICs** → clique na VNIC
- **IPv4 Addresses** → três pontinhos (⋮) → **Edit**
- Selecione **"Ephemeral public IP"** → Salve

### SSH Key

Ao clicar "Create", o Oracle pedirá para baixar a chave privada (.key). Salve esse arquivo em local seguro. Não tem como recuperar depois.

---

## 3. Conectar via SSH

Após a instância atingir o estado **"Running"**, anote o IP público e conecte:

```bash
# Ajustar permissões da chave (obrigatório)
chmod 400 ~/Downloads/ssh-key-cutucao.key

# Conectar
ssh -i ~/Downloads/ssh-key-cutucao.key ubuntu@SEU_IP_PUBLICO
```

Se a imagem for Oracle Linux em vez de Ubuntu, use `opc` no lugar de `ubuntu`.

---

## 4. Preparar o servidor

Execute os comandos abaixo na instância:

### 4.1. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2. Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

### 4.3. Instalar Git e dependências de compilação

```bash
sudo apt install -y git build-essential python3
```

### 4.4. Criar swap

Com 1 GB de RAM, o swap é importante para evitar que o `npm install` falhe:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 5. Instalar o cutuCÃO

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

Salve com `Ctrl+O`, Enter, `Ctrl+X`.

### 5.4. Configurar o bot

```bash
cp config.example.json config.json
nano config.json
```

Ajuste categorias, prefixos e horários conforme seu servidor. Consulte o [Guia Operacional](guia-operacional.md) para detalhes de cada campo.

### 5.5. Compilar e testar

```bash
mkdir -p data
npm run build
npm start
```

Verifique no Discord se o bot aparece online e teste com `/ajuda`. Depois pare com `Ctrl+C`.

---

## 6. Configurar como serviço (24/7)

O systemd garante que o bot rode permanentemente e reinicie após crashes ou reboots.

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
EnvironmentFile=/home/ubuntu/cutucao-bot/.env

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/ubuntu/cutucao-bot/data

[Install]
WantedBy=multi-user.target
```

Salve com `Ctrl+O`, Enter, `Ctrl+X`.

As diretivas de segurança no serviço (`NoNewPrivileges`, `ProtectSystem`, `ReadWritePaths`) garantem que o bot não consiga escrever fora da pasta `data/`.

### 6.2. Habilitar e iniciar

```bash
sudo systemctl daemon-reload
sudo systemctl enable cutucao
sudo systemctl start cutucao
```

### 6.3. Verificar

```bash
sudo systemctl status cutucao
```

Deve mostrar `active (running)`. Confirme nos logs:

```bash
sudo journalctl -u cutucao -n 20
```

Deve aparecer `🐕 Logado como cutuCÃO#XXXX`.

---

## 7. Script de atualização

Para atualizar o cutuCÃO quando houver novas versões:

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

Para atualizar, conecte via SSH e rode:

```bash
~/update-cutucao.sh
```

---

## 8. Manutenção

### Comandos úteis

```bash
# Status do bot
sudo systemctl status cutucao

# Logs em tempo real
sudo journalctl -u cutucao -f

# Últimas 50 linhas de log
sudo journalctl -u cutucao -n 50

# Logs de erro da última hora
sudo journalctl -u cutucao --since "1 hour ago" --priority err

# Reiniciar o bot
sudo systemctl restart cutucao

# Parar o bot
sudo systemctl stop cutucao

# Uso de disco
df -h
du -sh ~/cutucao-bot/data/
```

### Atualizar o sistema operacional

Faça pelo menos uma vez por mês:

```bash
sudo apt update && sudo apt upgrade -y
```

Se o kernel for atualizado, reinicie a instância:

```bash
sudo reboot
```

O systemd reinicia o cutuCÃO automaticamente após o reboot.

### Evitar reclamação de instância ociosa

A Oracle pode desligar instâncias Always Free que considerar ociosas. O cutuCÃO mantém atividade constante (conexão WebSocket com o Discord), mas para garantia extra:

- Monitore e-mails da Oracle (eles avisam antes de reclamar)
- Mantenha o sistema atualizado (acessar a instância periodicamente já demonstra uso)

---

## 9. Troubleshooting

### Bot não conecta ao Discord

```bash
sudo journalctl -u cutucao -n 30
```

- `"Falha no login. Verifique DISCORD_TOKEN"` → Token inválido no `.env`. Verifique ou gere um novo no Discord Developer Portal.
- `"Connect Timeout Error"` → Problema de rede. Verifique a Security List da VCN (Egress deve permitir All Protocols para 0.0.0.0/0).

### Não consegue conectar via SSH

- Verifique se o IP público está atribuído (Compute → Instance → Attached VNICs)
- Verifique a Security List: deve ter regra de Ingress para porta 22 TCP
- Verifique o firewall do OS: `sudo iptables -L -n` (Ubuntu 24.04 geralmente não tem regras restritivas por padrão)

### npm install falha por memória

Se o processo for morto por falta de memória durante a instalação:

```bash
# Verificar se o swap está ativo
free -h

# Se não estiver, criar
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Bot para de funcionar após dias

Verifique se a instância ainda está rodando no console Oracle Cloud. Se foi reclamada por ociosidade, recrie-a seguindo este guia novamente.

```bash
# Verificar se o serviço crashou
sudo systemctl status cutucao

# Ver motivo do crash
sudo journalctl -u cutucao --since "24 hours ago"
```

---

## Referência rápida

| Item | Valor |
|---|---|
| Shape | VM.Standard.E2.1.Micro |
| CPU / RAM | 1 OCPU / 1 GB |
| OS | Ubuntu 24.04 LTS |
| Custo | Gratuito permanente |
| Usuário SSH | `ubuntu` |
| Diretório do bot | `/home/ubuntu/cutucao-bot` |
| Banco de dados | `/home/ubuntu/cutucao-bot/data/cutucao.db` |
| Serviço systemd | `cutucao.service` |
| Logs | `sudo journalctl -u cutucao` |
| Atualizar | `~/update-cutucao.sh` |
