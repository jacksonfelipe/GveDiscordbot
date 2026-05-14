# GvE Discord Bot & API Hub 🛡️

Sistema integrado para servidores Lineage 2 GvE. Conecta seu servidor ao Discord e fornece um Mapa de Calor em tempo real para o site.

## 🚀 Como rodar no Linux VPS

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/jacksonfelipe/GveDiscordbot.git
   cd GveDiscordbot
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` baseado no `.env.example`:
   ```bash
   nano .env
   ```

4. **Inicie o Bot:**
   Recomendo usar o **PM2** para manter o bot rodando 24h:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "gve-bot"
   pm2 save
   ```

## 🛠️ Comandos Disponíveis (Discord)
- `!top`: Top 10 matadores PVP.
- `!score`: Placar das facções (Light vs Dark).
- `!wiki [item]`: Busca de itens no banco de dados.

## 📡 API Endpoints
- `GET /api/donations/notify`: Usado pelo UCP para anunciar doações.
- `GET /api/heatmap/pvp`: Fornece dados para o mapa de calor.
