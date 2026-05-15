const fs = require('fs');
const readline = require('readline');

async function getSchema() {
    const tableName = process.argv[2] || 'characters';
    const fileStream = fs.createReadStream('c:/xampp/htdocs/l2jpremium.com.br-online/hub/l2jpremiumgve.sql');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let found = false;
    let linesAfter = 0;
    for await (const line of rl) {
        if (line.includes(`CREATE TABLE \`${tableName}\``)) {
            found = true;
        }
        
        if (found) {
            console.log(line);
            linesAfter++;
            if (line.includes(';') || linesAfter > 100) break;
        }
    }
}

getSchema();
