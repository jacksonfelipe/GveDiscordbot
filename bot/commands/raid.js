const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'raid',
    description: 'Verifica o status dos Raid Bosses de nível baixo/médio',
    async execute(message, args) {
        try {
            let query = '';
            let params = [];

            if (!args.length) {
                // Lista de Raids (Nvel 20 a 69)
                query = `
                    SELECT n.name, r.currentHp, r.respawn_time, n.level
                    FROM npc n
                    JOIN raidboss_spawnlist r ON n.id = r.boss_id
                    WHERE n.level BETWEEN 20 AND 69
                    ORDER BY n.level DESC
                    LIMIT 20
                `;
            } else {
                const searchTerm = `%${args.join(' ')}%`;
                query = `
                    SELECT n.name, r.currentHp, r.respawn_time, n.level
                    FROM npc n
                    JOIN raidboss_spawnlist r ON n.id = r.boss_id
                    WHERE n.name LIKE ?
                    LIMIT 10
                `;
                params = [searchTerm];
            }

            const [raids] = await db.query(query, params);

            if (raids.length === 0) {
                return message.reply('Nenhum Raid encontrado.');
            }

            const embed = new EmbedBuilder()
                .setTitle(!args.length ? '⚔️ Lista de Raid Bosses (Lvl 20-69)' : `🔎 Raid: "${args.join(' ')}"`)
                .setColor('#2ecc71')
                .setTimestamp();

            raids.forEach(raid => {
                const isAlive = raid.currentHp > 0;
                const status = isAlive ? '🟢 VIVO' : '🔴 MORTO';
                let info = `Lvl ${raid.level} - ${status}`;

                if (!isAlive && raid.respawn_time > 0) {
                    const respawnDate = new Date(raid.respawn_time).toLocaleString('pt-BR');
                    info += `\n⏰ Volta: ${respawnDate}`;
                }

                embed.addFields({ name: raid.name, value: info, inline: true });
            });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao consultar os Raids.');
        }
    },
};
