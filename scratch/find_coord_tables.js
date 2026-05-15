const fs = require('fs');
const readline = require('readline');

async function findCoordinateTables() {
    const fileStream = fs.createReadStream('c:/xampp/htdocs/l2jpremium.com.br-online/hub/l2jpremiumgve.sql');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentTable = null;
    let tableLines = [];
    for await (const line of rl) {
        const createMatch = line.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`([^`]+)`/i);
        if (createMatch) {
            currentTable = createMatch[1];
            tableLines = [line];
            continue;
        }

        if (currentTable) {
            tableLines.push(line);
            if (line.includes(';')) {
                const schema = tableLines.join('\n').toLowerCase();
                if (schema.includes('`x`') && schema.includes('`y`')) {
                    console.log(`--- TABLE WITH COORDS: ${currentTable} ---`);
                    console.log(tableLines.join('\n'));
                }
                currentTable = null;
                tableLines = [];
            }
        }
    }
}

findCoordinateTables();
