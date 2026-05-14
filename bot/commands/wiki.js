const db = require('../../api/db');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'wiki',
    description: 'Busca informações de um item no banco de dados',
    async execute(message, args) {
        if (!args.length) return message.reply('Por favor, digite o nome de um item. Ex: `!wiki draconic`');

        const searchTerm = `%${args.join(' ')}%`;

        try {
            // Busca em weapon, armor e etcitem
            const query = `
                (SELECT item_id, name, 'Weapon' as type FROM weapon WHERE name LIKE ?)
                UNION
                (SELECT item_id, name, 'Armor' as type FROM armor WHERE name LIKE ?)
                UNION
                (SELECT item_id, name, 'Item' as type FROM etcitem WHERE name LIKE ?)
                LIMIT 5
            `;

            const [items] = await db.query(query, [searchTerm, searchTerm, searchTerm]);

            if (items.length === 0) {
                return message.reply('Nenhum item encontrado com esse nome.');
            }

            const embed = new EmbedBuilder()
                .setTitle(`🔎 Resultados da Wiki: "${args.join(' ')}"`)
                .setColor('#0099ff')
                .setTimestamp();

            items.forEach(item => {
                embed.addFields({ name: `[${item.item_id}] ${item.name}`, value: `Tipo: ${item.type}`, inline: false });
            });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.reply('Erro ao consultar o banco de dados.');
        }
    },
};
