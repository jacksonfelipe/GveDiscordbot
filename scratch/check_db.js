const db = require('../api/db');

async function check() {
    try {
        const [rows] = await db.query("SHOW TABLES LIKE '%pvp%'");
        console.log("Tabelas encontradas:", rows);
        
        const [rows2] = await db.query("SHOW TABLES LIKE '%log%'");
        console.log("Tabelas de Log:", rows2);

        process.exit(0);
    } catch (err) {
        console.error("Erro:", err);
        process.exit(1);
    }
}

check();
