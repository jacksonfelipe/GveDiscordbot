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
    // Uso de optional chaining para evitar o erro de 'undefined'
    const char_name = req.query?.char_name || req.body?.char_name;
    const coins = req.query?.coins || req.body?.coins;
    const db = require('./api/db');
    
    console.log(`[NOTIFY] Recebida tentativa de aviso: ${char_name} - ${coins} coins`);

    if (!char_name || !coins) {
        console.log(`[NOTIFY] Erro: Dados incompletos recebidos`);
        return res.status(400).json({ error: 'Missing char_name or coins' });
    }

    try {
        // Busca o canal de forma mais inteligente
        const channel = client.channels.cache.find(c =>
            c.name.toLowerCase().includes('doação') ||
            c.name.toLowerCase().includes('doacao') ||
            c.name.toLowerCase().includes('donate') ||
            c.name.toLowerCase().includes('anuncio') ||
            c.id === '1504617416805333705' // Mantém o ID anterior por precaução
        );

        if (channel) {
            console.log(`[NOTIFY] Enviando anúncio para o canal: #${channel.name} (${channel.id})`);
            const embed = new EmbedBuilder()
                .setTitle('💎 Nova Doação Confirmada!')
                .setDescription(`O jogador **${char_name}** acaba de adquirir **${coins} P-Coins**!`)
                .addFields({ name: 'Status', value: '✅ Entrega Automática Concluída', inline: true })
                .setColor('#00ff00')
                .setThumbnail('https://l2jpremium.com.br/assets/images/pcoin.png') // Ícone de moeda opcional
                .setFooter({ text: 'Obrigado por apoiar o L2JPremium!' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
            console.log(`[NOTIFY] Sucesso: Anúncio enviado para ${char_name}`);
        } else {
            console.log(`[NOTIFY] ALERTA: Nenhum canal de anúncios encontrado!`);
            console.log(`[NOTIFY] Canais disponíveis para o bot:`, client.channels.cache.map(c => `${c.name} (${c.id})`).join(', '));
        }

        res.json({ success: true });
    } catch (err) {
        console.error(`[NOTIFY] Erro fatal ao enviar anúncio:`, err);
        res.status(500).json({ error: 'Erro ao enviar anúncio' });
    }
});

// Outras rotas (Heatmap, etc)
const heatmapRoutes = require('./api/heatmap');
app.use('/api/heatmap', heatmapRoutes);

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[API] Rodando na porta ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
