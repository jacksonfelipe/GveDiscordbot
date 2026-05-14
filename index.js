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

// Serve arquivos estticos (Mapa de Calor)
app.use('/web', express.static(path.join(__dirname, 'web')));

// Rota amigvel para o mapa
app.get('/heatmap', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/heatmap.html'));
});

// Rota de Doao (Avisa no Discord)
app.all('/api/donations/notify', async (req, res) => {
    const char_name = req.query.char_name || req.body.char_name;
    const coins = req.query.coins || req.body.coins;
    
    console.log(`[NOTIFY] Recebida tentativa de aviso: ${char_name} - ${coins} coins`);

    if (!char_name || !coins) return res.status(400).send('Missing data');

    try {
        // Encontra o canal de anúncios (busca por nome ou ID)
        const channel = client.channels.cache.find(c => c.name.includes('anúncios') || c.id === '1504617416805333705');
        
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('💎 Nova Doação Confirmada!')
                .setDescription(`O jogador **${char_name}** acaba de adquirir **${coins} P-Coins**!`)
                .addFields({ name: 'Status', value: '✅ Entrega Automática Concluída', inline: true })
                .setColor('#00ff00')
                .setFooter({ text: 'Obrigado por apoiar o L2JPremium!' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
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
