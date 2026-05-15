const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || '51.222.146.73',
    user: process.env.DB_USER || 'website',
    password: process.env.DB_PASS || 'ZiQ277=o2B2R9$',
    database: process.env.DB_NAME || 'l2jpremiumgve',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
