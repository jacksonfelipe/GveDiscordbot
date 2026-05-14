const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'status',
    description: 'Verifica o status detalhado de um personagem',
    async execute(message, args) {
        if (!args.length) return message.reply('Por favor, digite o nome do personagem. Ex: `!status Jackson`');

        const charName = args[0];

        try {
            const [rows] = await db.query(`
                SELECT c.char_name, c.level, c.pvpkills, c.pkkills, c.faction, c.online, c.title,
                       cl.clan_name
                FROM characters c
                LEFT JOIN clan_data cl ON c.clanid = cl.clan_id
                WHERE c.char_name = ?
                LIMIT 1
            `, [charName]);

            if (rows.length === 0) {
                return message.reply('Personagem não encontrado.');
            }

            const char = rows[0];
            const factionIcon = char.faction === 'Angel' ? '🔵 Light' : (char.faction === 'Evil' ? '🔴 Dark' : '⚪ Neutro');
            const statusIcon = char.online ? '🟢 Online' : '🔴 Offline';

            const embed = new EmbedBuilder()
                .setTitle(`👤 Perfil de Personagem: ${char.char_name}`)
                .setDescription(char.title ? `*"${char.title}"*` : null)
                .setColor(char.faction === 'Angel' ? '#3498db' : (char.faction === 'Evil' ? '#e74c3c' : '#95a5a6'))
                .addFields(
                    { name: 'Nível', value: `${char.level}`, inline: true },
                    { name: 'Status', value: statusIcon, inline: true },
                    { name: 'Facção', value: factionIcon, inline: true },
                    { name: 'PvP Kills', value: `⚔️ ${char.pvpkills}`, inline: true },
                    { name: 'PK Kills', value: `💀 ${char.pkkills}`, inline: true },
                    { name: 'Clã', value: char.clan_name || 'Sem Clã', inline: true }
                )
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao buscar o status do personagem.');
        }
    },
};
