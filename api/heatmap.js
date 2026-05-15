const express = require('express');
const router = express.Router();
const db = require('./db');

// Endpoint para buscar zonas de interesse dinâmicas do banco
router.get('/zones', async (req, res) => {
    try {
        // Busca Teleportes Customizados
        const [teleports] = await db.query(`
            SELECT description as name, loc_x as x, loc_y as y, 'teleport' as type 
            FROM custom_teleports
        `);

        // Busca Territórios GvE (Fortes) com base na média dos spawns deles
        const [forts] = await db.query(`
            SELECT t.fort_name as name, AVG(s.x) as x, AVG(s.y) as y, 'fort' as type
            FROM gve_territories t
            JOIN fort_spawnlist s ON t.fort_id = s.fortId
            GROUP BY t.fort_id
        `);

        res.json([...teleports, ...forts]);
    } catch (err) {
        console.error('Erro ao buscar zonas:', err);
        res.json([]);
    }
});

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
