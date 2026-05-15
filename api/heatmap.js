const express = require('express');
const router = express.Router();
const db = require('./db');

// Endpoint para buscar locais de jogadores online (Heatmap de Atividade)
router.get('/pvp', async (req, res) => {
    try {
        // Buscando a localização de todos os jogadores online na tabela characters
        const [rows] = await db.query(`
            SELECT x, y, z, char_name, faction
            FROM characters 
            WHERE online = 1
            LIMIT 1000
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Erro na query do heatmap:', err);
        res.json([]);
    }
});

// Endpoint para buscar domnio de territrio (GvE)
router.get('/territories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT territory_name, owner_faction FROM gve_territories');
        res.json(rows);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;
