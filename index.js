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

// --- VIGILÂNCIA DE DOAÇÕES (Polling no Banco) ---
let lastCheckedProtocol = 0;

async function checkNewDonations() {
    try {
        const db = require('./api/db');
        // Busca doações entregues (status 4) recentemente
        const [donations] = await db.query(
            'SELECT protocolo, account, quant_coins, coins_bonus, ultima_alteracao FROM site_donations WHERE status = 4 AND protocolo > ? ORDER BY protocolo ASC',
            [lastCheckedProtocol]
        );

        if (donations.length > 0) {
            for (const order of donations) {
                const totalCoins = parseInt(order.quant_coins) + parseInt(order.coins_bonus);
                const char_name = await getCharName(order.account);
                
                // Envia a notificação (Reutilizando a lógica do Discord)
                await sendDiscordDonation(char_name, totalCoins);
                
                // Atualiza o último protocolo para não repetir
                if (order.protocolo > lastCheckedProtocol) {
                    lastCheckedProtocol = order.protocolo;
                }
            }
        } else if (lastCheckedProtocol === 0) {
            // Inicializa com o último ID do banco na primeira execução
            const [last] = await db.query('SELECT MAX(protocolo) as maxId FROM site_donations');
            lastCheckedProtocol = last[0].maxId || 0;
            console.log(`[DONATE-WATCH] Iniciado. Monitorando a partir do protocolo #${lastCheckedProtocol}`);
        }
    } catch (err) {
        console.error(`[DONATE-WATCH] Erro ao verificar banco:`, err.message);
    }
}

async function getCharName(account) {
    const db = require('./api/db');
    try {
        const [rows] = await db.query('SELECT char_name FROM characters WHERE account_name = ? ORDER BY pvpkills DESC LIMIT 1', [account]);
        return rows.length > 0 ? rows[0].char_name : account;
    } catch (e) { return account; }
}

async function sendDiscordDonation(char_name, coins) {
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
                .setTitle('💎 Nova Doação Confirmada!')
                .setDescription(`O jogador **${char_name}** da facção **${factionName}** acaba de adquirir **${coins} P-Coins**!`)
                .addFields(
                    { name: 'Doador', value: `👤 ${char_name}`, inline: true },
                    { name: 'Quantidade', value: `💰 ${coins} P-Coins`, inline: true }
                )
                .setColor(color)
                .setThumbnail('https://l2jpremium.com.br/assets/images/pcoin.png')
                .setFooter({ text: 'L2JPremium GvE - Monitoramento Automático' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`[DONATE-WATCH] Anúncio enviado: ${char_name}`);
        }
    } catch (err) { console.error(`[DONATE-WATCH] Erro no Discord:`, err); }
}

// Inicia a vigilância a cada 30 segundos
setInterval(checkNewDonations, 30000);

// Outras rotas (Heatmap, etc)
const heatmapRoutes = require('./api/heatmap');
app.use('/api/heatmap', heatmapRoutes);

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[API] Rodando na porta ${PORT}`);
    checkNewDonations(); // Primeira execução imediata
});

client.login(process.env.DISCORD_TOKEN);
