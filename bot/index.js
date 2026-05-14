const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
console.log("DEBUG: Conteudo do arquivo .env (primeiros 20 chars):", envContent.substring(0, 20));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

console.log("DEBUG: Token presente no ENV?", process.env.DISCORD_TOKEN ? "SIM" : "NÃO");
console.log("DEBUG: Path do ENV:", path.join(__dirname, '../.env'));

client.commands = new Collection();

// Carregar Comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
    }
}

client.once('ready', () => {
    console.log(`Bot Logado como ${client.user.tag}!`);
});

// Listener de mensagens
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Houve um erro ao executar esse comando.');
    }
});

client.login(process.env.DISCORD_TOKEN);
