#!/bin/bash

# GvE Hub - Professional VPS Installer (SSL & Performance)

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}   GVE HUB - VPS PRO INSTALLER (SSL)     ${NC}"
echo -e "${CYAN}==========================================${NC}"

# 1. Domnio Fixo
DOMAIN="hub.l2jpremium.com.br"

# 2. Check & Install Caddy (For Automatic SSL)
echo -e "${YELLOW}[1/4] Instalando Caddy (Servidor Proxy & SSL)...${NC}"
if ! command -v caddy &> /dev/null; then
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy -y
fi

# 3. Configure Caddyfile
echo -e "${YELLOW}[2/4] Configurando SSL para $DOMAIN...${NC}"
cat <<EOF > Caddyfile
$DOMAIN {
    reverse_proxy localhost:3001
    encode gzip zstd
}
EOF
sudo mv Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy

# 4. Install Dependencies
echo -e "${YELLOW}[3/4] Instalando pacotes do Node.js...${NC}"
npm install

# 5. Start with PM2
echo -e "${YELLOW}[4/4] Iniciando Bot com PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
pm2 delete gve-hub 2>/dev/null
pm2 start index.js --name "gve-hub"
pm2 save

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}   INSTALAÇÃO CONCLUÍDA COM SUCESSO!      ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "-> Domínio Ativo: ${CYAN}https://$DOMAIN${NC}"
echo -e "-> SSL: Ativado Automaticamente"
echo -e "-> Bot Status: Rodando via PM2"
echo -e "${GREEN}==========================================${NC}"
