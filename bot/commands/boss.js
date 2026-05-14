const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'boss',
    description: 'Verifica o status de um Raid Boss',
    async execute(message, args) {
        try {
            let query = '';
            let params = [];

            if (!args.length) {
                // Se no digitar nome, mostra os principais
                query = `
                    SELECT n.name, r.currentHp, r.respawn_time, n.level
                    FROM npc n
                    JOIN raidboss_spawnlist r ON n.id = r.boss_id
                    WHERE n.level >= 70
                    ORDER BY n.level DESC, n.name ASC
                    LIMIT 20
                `;
            } else {
                // Busca especfica
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

            const [bosses] = await db.query(query, params);

            if (bosses.length === 0) {
                return message.reply('Nenhum Raid Boss encontrado.');
            }

            const embed = new EmbedBuilder()
                .setTitle(!args.length ? '👺 Quadro Geral de Raid Bosses' : `🔎 Resultado para: "${args.join(' ')}"`)
                .setDescription(!args.length ? 'Lista dos principais bosses do servidor.' : null)
                .setColor(args.length ? '#e74c3c' : '#3498db')
                .setTimestamp();

            bosses.forEach(boss => {
                const isAlive = boss.currentHp > 0;
                const status = isAlive ? '🟢 VIVO' : '🔴 MORTO';
                let info = `Lvl ${boss.level} - ${status}`;

                if (!isAlive && boss.respawn_time > 0) {
                    const respawnDate = new Date(boss.respawn_time).toLocaleString('pt-BR');
                    info += `\n⏰ Volta: ${respawnDate}`;
                }

                embed.addFields({ name: boss.name, value: info, inline: true });
            });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao consultar o status dos Bosses.');
        }
    },
};
