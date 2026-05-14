const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leiloes',
    description: 'Mostra os leilões ativos no servidor',
    async execute(message, args) {
        try {
            const [rows] = await db.query(`
                SELECT id, itemName, currentBid, startingBid, endDate, sellerName 
                FROM auction 
                WHERE endDate > NOW()
                ORDER BY endDate ASC 
                LIMIT 5
            `);

            const embed = new EmbedBuilder()
                .setTitle('🔨 Leilões Ativos no Servidor')
                .setDescription('Confira os itens raros em disputa agora!')
                .setColor('#9b59b6')
                .setTimestamp();

            if (rows.length === 0) {
                return message.reply('Não há leilões ativos no momento.');
            }

            rows.forEach(item => {
                const price = item.currentBid > 0 ? item.currentBid : item.startingBid;
                const date = new Date(item.endDate).toLocaleString('pt-BR');
                
                embed.addFields({ 
                    name: `🎁 ${item.itemName}`, 
                    value: `💰 Lance Atual: **${price}**\n👤 Vendedor: ${item.sellerName}\n⏰ Termina em: ${date}`, 
                    inline: false 
                });
            });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao buscar os leilões.');
        }
    },
};
