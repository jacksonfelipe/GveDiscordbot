const express = require('express');
const router = express.Router();
const db = require('./db');

// Endpoint para buscar locais de PVP recente (últimos 30 minutos)
router.get('/pvp', async (req, res) => {
    try {
        // Exemplo de query buscando logs de PVP. Ajustar conforme as tabelas do seu core.
        // Se no houver tabela de logs, podemos criar uma trigger no banco.
        const [rows] = await db.query(`
            SELECT x, y, z, victim_id, killer_id, time 
            FROM pvp_logs 
            WHERE time > UNIX_TIMESTAMP(NOW() - INTERVAL 30 MINUTE)
            LIMIT 500
        `);
        
        res.json(rows);
    } catch (err) {
        // Se a tabela no existir, retorna vazio em vez de erro
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
