const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    description: 'Mostra os 10 maiores matadores (PVP) do servidor',
    async execute(message, args) {
        try {
            const [rows] = await db.query(`
                SELECT char_name, pvpkills, faction 
                FROM characters 
                WHERE accesslevel = 0
                ORDER BY pvpkills DESC 
                LIMIT 10
            `);

            const embed = new EmbedBuilder()
                .setTitle('🏆 Hall da Fama - Top 10 Killers')
                .setDescription('Os guerreiros mais temidos de Elmoreaden!')
                .setColor('#ffd700')
                .setTimestamp();

            if (rows.length === 0) {
                return message.reply('Ainda não há dados de PVP registrados.');
            }

            rows.forEach((row, index) => {
                const factionIcon = row.faction === 'Angel' ? '🔵' : (row.faction === 'Evil' ? '🔴' : '⚪');
                embed.addFields({ 
                    name: `${index + 1}. ${factionIcon} ${row.char_name}`, 
                    value: `🔥 **${row.pvpkills}** Kills`, 
                    inline: false 
                });
            });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao buscar o ranking.');
        }
    },
};
