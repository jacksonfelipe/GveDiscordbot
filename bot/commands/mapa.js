const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'mapa',
    description: 'Envia o link do Mapa de Calor em tempo real',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('📍 Mapa de Calor em Tempo Real')
            .setDescription('Veja onde o PVP está pegando fogo agora mesmo!')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/854/854878.png')
            .addFields({ 
                name: '🔗 Link do Mapa', 
                value: '[Clique aqui para abrir o Mapa](http://hub.l2jpremium.com.br/heatmap)' 
            })
            .setColor('#f39c12')
            .setFooter({ text: 'Atualizado a cada 5 segundos' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
