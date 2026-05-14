const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'score',
    description: 'Mostra o placar atual das facções GvE',
    async execute(message, args) {
        try {
            const [rows] = await db.query(`
                SELECT faction, COUNT(*) as total 
                FROM characters 
                WHERE faction IS NOT NULL AND faction <> ''
                GROUP BY faction
            `);

            const embed = new EmbedBuilder()
                .setTitle('⚔️ Placar GvE (Domínio de Facções)')
                .setDescription('Confira como está o equilíbrio de forças no reino agora!')
                .setColor('#ffcc00')
                .setTimestamp();

            let hasData = false;
            rows.forEach(row => {
                if (row.faction === 'None' || !row.faction) return;
                hasData = true;
                const factionName = row.faction === 'Angel' ? '🔵 LIGHT FORCE' : '🔴 DARK LEGION';
                embed.addFields({ name: factionName, value: `**${row.total}** Guerreiros Ativos`, inline: true });
            });

            if (!hasData) {
                return message.reply('Ainda não há dados de facções disponíveis.');
            }

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao buscar o placar no servidor.');
        }
    },
};
