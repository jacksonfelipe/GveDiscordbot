const fs = require('fs');
const readline = require('readline');

async function findPotentialTables() {
    const fileStream = fs.createReadStream('c:/xampp/htdocs/l2jpremium.com.br-online/hub/l2jpremiumgve.sql');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const tables = new Set();
    for await (const line of rl) {
        const match = line.match(/INSERT INTO `([^`]+)`/);
        if (match) {
            tables.add(match[1]);
        }
    }

    console.log('--- POTENTIAL LOG TABLES ---');
    Array.from(tables).filter(t => 
        t.includes('log') || 
        t.includes('history') || 
        t.includes('kill') || 
        t.includes('pvp') || 
        t.includes('event') ||
        t.includes('score') ||
        t.includes('stats')
    ).sort().forEach(t => console.log(t));
}

findPotentialTables();
