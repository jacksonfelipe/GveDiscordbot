const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ajuda',
    description: 'Responde dúvidas sobre o servidor e sua história',
    async execute(message, args) {
        if (!args.length) return message.reply('Como posso te ajudar? Digite sua dúvida. Ex: `!ajuda faccoes`');

        const query = args.join(' ').toLowerCase();

        const embed = new EmbedBuilder()
            .setTitle('📖 Guia L2JPremium GvE')
            .setColor('#f1c40f')
            .setTimestamp();

        if (query.includes('faccao') || query.includes('faccoes')) {
            embed.setDescription('No nosso servidor, você deve escolher entre a **🔵 Light Force** e a **🔴 Dark Legion**. Cada uma luta pelo controle de territórios e Bosses. Você pode trocar de facção no NPC de facções em Giran.');
        } 
        else if (query.includes('coin') || query.includes('doar')) {
            embed.setDescription('Para adquirir P-Coins, use o comando `/doar` no nosso site. A entrega é 100% automática e você recebe um aviso aqui no Discord assim que o pagamento for aprovado!');
        }
        else if (query.includes('pvp') || query.includes('farm')) {
            embed.setDescription('O melhor lugar para PvP e Farm são as **Zonas de Conflito**. Fique atento ao Mapa de Calor no site para ver onde a luta está mais intensa no momento!');
        }
        else {
            embed.setDescription('Ainda estou aprendendo sobre este reino! Tente perguntar sobre `facções`, `P-Coins` ou `PvP`.');
        }

        message.reply({ embeds: [embed] });
    },
};
