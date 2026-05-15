const fs = require('fs');
const readline = require('readline');

async function getTables() {
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

    console.log('--- TABLES FOUND ---');
    Array.from(tables).sort().forEach(t => console.log(t));
    console.log('--- END ---');
}

getTables();
