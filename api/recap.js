const db = require('./db');

/**
 * Gera as estatisticas de um jogador para o resumo mensal
 */
async function getPlayerRecap(charId) {
    try {
        const [pvp] = await db.query('SELECT COUNT(*) as total FROM pvp_logs WHERE killer_id = ? AND time > UNIX_TIMESTAMP(NOW() - INTERVAL 30 DAY)', [charId]);
        const [farming] = await db.query('SELECT SUM(count) as total FROM items_logs WHERE charId = ? AND itemId = 57 AND time > UNIX_TIMESTAMP(NOW() - INTERVAL 30 DAY)', [charId]);
        
        return {
            pvp: pvp[0].total || 0,
            adena: farming[0].total || 0,
            month: new Date().toLocaleString('pt-BR', { month: 'long' })
        };
    } catch (err) {
        return null;
    }
}

module.exports = { getPlayerRecap };
