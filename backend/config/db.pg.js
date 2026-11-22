
require('dns').setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER,
    password: process.env.EPD1_APP_DB_PASSWORD,

    ssl: {
        rejectUnauthorized: false,
        servername: process.env.SUPABASE_DB_HOST
    },

    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
    console.error(
        'Terjadi kesalahan pada koneksi PostgreSQL:',
        err.message
    );
});

module.exports = pool;
