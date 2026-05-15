const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// --- CONFIGURAO DO BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'bot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`[BOT] Logado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (command) {
        try { await command.execute(message, args); } catch (e) { console.error(e); }
    }
});

// --- CONFIGURAO DA API ---
const app = express();
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos (Mapa de Calor)
app.use('/web', express.static(path.join(__dirname, 'web')));
app.use(express.static(path.join(__dirname, 'web')));

// Rota amigvel para o mapa
app.get('/heatmap', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/heatmap.html'));
});

// Página inicial para não dar erro
app.get('/', (req, res) => {
    res.send(`
        <body style="background: #111; color: #ffd700; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <h1>🛡️ L2JPremium GvE Hub</h1>
            <p style="color: #ccc;">O coração do seu servidor está batendo!</p>
            <a href="/heatmap" style="color: #ffd700; text-decoration: none; border: 1px solid #ffd700; padding: 10px 20px; border-radius: 5px;">Abrir Mapa de Calor</a>
        </body>
    `);
});

// Rota de Doação (Avisa no Discord com Inteligência de Facção)
app.all('/api/donations/notify', async (req, res) => {
    const char_name = req.query?.char_name || req.body?.char_name;
    const coins = req.query?.coins || req.body?.coins;
    const db = require('./api/db');
    
    console.log(`[NOTIFY] Tentativa de aviso: ${char_name} - ${coins} coins`);

    if (!char_name || !coins) {
        console.log(`[NOTIFY] Erro: Dados insuficientes (Char: ${char_name}, Coins: ${coins})`);
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        // Busca facção (Opcional - Não trava se o banco falhar)
        let faction = '';
        try {
            const [rows] = await db.query('SELECT faction FROM characters WHERE char_name = ? LIMIT 1', [char_name]);
            if (rows && rows.length > 0) faction = (rows[0].faction || '').toString().toLowerCase();
        } catch (dbErr) {
            console.log(`[NOTIFY] DB Warning: ${dbErr.message}`);
        }

        // Estilo
        let color = '#ffffff'; 
        let factionName = 'Neutro';
        let thumb = 'https://l2jpremium.com.br/assets/images/pcoin.png';

        if (faction.includes('angel') || faction === '1') {
            color = '#4444ff'; factionName = 'Angel';
        } else if (faction.includes('evil') || faction === '2') {
            color = '#ff4444'; factionName = 'Evil';
        }

        const channel = client.channels.cache.find(c => 
            c.name.toLowerCase().includes('doação') || 
            c.name.toLowerCase().includes('doacao') || 
            c.name.toLowerCase().includes('donate') || 
            c.name.toLowerCase().includes('anuncio') ||
            c.id === '1504617416805333705'
        );
        
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('💎 Nova Doação Confirmada!')
                .setDescription(`O jogador **${char_name}** acaba de adquirir **${coins} P-Coins**!`)
                .addFields(
                    { name: 'Doador', value: `👤 ${char_name}`, inline: true },
                    { name: 'Facção', value: `🛡️ ${factionName}`, inline: true },
                    { name: 'Quantidade', value: `💰 ${coins} P-Coins`, inline: true }
                )
                .setColor(color)
                .setThumbnail(thumb)
                .setFooter({ text: 'Obrigado por apoiar o L2JPremium GvE!' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`[NOTIFY] Sucesso: Anúncio enviado para ${char_name} (${factionName})`);
            return res.json({ success: true });
        } else {
            console.log(`[NOTIFY] ALERTA: Nenhum canal encontrado!`);
            return res.status(404).json({ error: 'Channel not found' });
        }
    } catch (err) {
        console.error(`[NOTIFY] Erro Crítico:`, err);
        return res.status(500).json({ error: 'Internal Error' });
    }
});

// --- VIGILÂNCIA DUPLA (Monitora Site e Jogo) ---
let lastCheckedProtocol = 0;
let lastCheckedDeliveryId = 0;

async function checkDonationActivity() {
    const db = require('./api/db');
    
    // 1. Monitora site_donations (Aprovação no Site)
    try {
        const [donations] = await db.query(
            'SELECT protocolo, account, quant_coins, coins_bonus FROM site_donations WHERE status = 4 AND protocolo > ? ORDER BY protocolo ASC',
            [lastCheckedProtocol]
        );
        for (const order of donations) {
            const total = parseInt(order.quant_coins) + parseInt(order.coins_bonus);
            const charName = await getCharName(order.account);
            await sendDiscordAnnouncement('💎 Nova Doação!', charName, total, 'Aprovada no Site');
            lastCheckedProtocol = Math.max(lastCheckedProtocol, order.protocolo);
        }
        if (lastCheckedProtocol === 0) {
            const [max] = await db.query('SELECT MAX(protocolo) as id FROM site_donations');
            lastCheckedProtocol = max[0].id || 0;
        }
    } catch (e) { console.error("[WATCH-SITE] Erro:", e.message); }

    // 2. Monitora web_delivery (Entrega no Jogo)
    try {
        const [deliveries] = await db.query(
            'SELECT id, char_name, count FROM web_delivery WHERE id > ? ORDER BY id ASC',
            [lastCheckedDeliveryId]
        );
        for (const deliv of deliveries) {
            await sendDiscordAnnouncement('🎁 Entrega Concluída!', deliv.char_name, deliv.count, 'Validada no Jogo');
            lastCheckedDeliveryId = Math.max(lastCheckedDeliveryId, deliv.id);
        }
        if (lastCheckedDeliveryId === 0) {
            const [max] = await db.query('SELECT MAX(id) as id FROM web_delivery');
            lastCheckedDeliveryId = max[0].id || 0;
        }
    } catch (e) { console.error("[WATCH-GAME] Erro:", e.message); }
}

async function getCharName(account) {
    const db = require('./api/db');
    try {
        const [rows] = await db.query('SELECT char_name FROM characters WHERE account_name = ? ORDER BY pvpkills DESC LIMIT 1', [account]);
        return rows.length > 0 ? rows[0].char_name : account;
    } catch (e) { return account; }
}

async function sendDiscordAnnouncement(title, char_name, coins, statusText) {
    try {
        const db = require('./api/db');
        let faction = '';
        try {
            const [rows] = await db.query('SELECT faction FROM characters WHERE char_name = ? LIMIT 1', [char_name]);
            if (rows && rows.length > 0) faction = (rows[0].faction || '').toString().toLowerCase();
        } catch (e) {}

        let color = '#ffffff'; let factionName = 'Neutro';
        if (faction.includes('angel') || faction === '1') { color = '#4444ff'; factionName = 'Angel'; }
        else if (faction.includes('evil') || faction === '2') { color = '#ff4444'; factionName = 'Evil'; }

        const channel = client.channels.cache.find(c => 
            c.name.toLowerCase().includes('doação') || c.name.toLowerCase().includes('doacao') || 
            c.name.toLowerCase().includes('donate') || c.name.toLowerCase().includes('anuncio') ||
            c.id === '1504617416805333705'
        );

        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(`O jogador **${char_name}** da facção **${factionName}** acaba de receber **${coins} P-Coins**!`)
                .addFields(
                    { name: 'Jogador', value: `👤 ${char_name}`, inline: true },
                    { name: 'Status', value: `✅ ${statusText}`, inline: true },
                    { name: 'Quantidade', value: `💰 ${coins} P-Coins`, inline: true }
                )
                .setColor(color)
                .setThumbnail('https://l2jpremium.com.br/assets/images/pcoin.png')
                .setFooter({ text: 'L2JPremium GvE - Monitoramento Ativo' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`[WATCH] Anúncio enviado: ${char_name} (${statusText})`);
        }
    } catch (err) { console.error(`[WATCH] Erro Discord:`, err); }
}

// Inicia a vigilância a cada 25 segundos
setInterval(checkDonationActivity, 25000);

// Outras rotas (Heatmap, etc)
const heatmapRoutes = require('./api/heatmap');
app.use('/api/heatmap', heatmapRoutes);

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[API] Rodando na porta ${PORT}`);
    checkDonationActivity(); // Chamada corrigida aqui
});

client.login(process.env.DISCORD_TOKEN);
