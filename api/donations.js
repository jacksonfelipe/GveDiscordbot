const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

// Endpoint para receber notificaes de doao do UCP
router.post('/notify', async (req, res) => {
    const { char_name, amount, coins } = req.body;

    if (!char_name || !coins) {
        return res.status(400).json({ error: 'Dados insuficientes' });
    }

    try {
        // Envia para o Bot (ou processa direto se o bot estiver no mesmo processo)
        // Por enquanto, vamos apenas registrar no console e deixar pronto para o Bot ler
        console.log(`[DONATION] ${char_name} doou e recebeu ${coins} P-Coins!`);
        
        // Aqui chamaremos uma funo global que o Bot vai escutar
        if (global.sendDiscordAnnouncement) {
            global.sendDiscordAnnouncement(`🛡️ **Nova Doação Recebida!**\nO jogador **${char_name}** acaba de adquirir **${coins} P-Coins**.\nObrigado por apoiar o servidor! ⚔️`);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
