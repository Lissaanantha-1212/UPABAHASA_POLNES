require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: 'epd1_app.aquqdodntgzjdfcvxgbs',
    password: process.env.EPD1_APP_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000
});

async function testConnection() {
    try {
        const result = await pool.query(`
            SELECT
                current_user,
                current_database(),
                has_table_privilege(current_user, 'public.posts', 'SELECT') AS can_access_epd1,
                has_table_privilege(current_user, 'public."Mahasiswa"', 'SELECT') AS can_access_epd2
        `);

        console.log('\nHASIL TES KONEKSI EPD1:');
        console.table(result.rows);
    } catch (error) {
        console.error('\nTES KONEKSI GAGAL:', error.message);
    } finally {
        await pool.end();
    }
}

testConnection();
