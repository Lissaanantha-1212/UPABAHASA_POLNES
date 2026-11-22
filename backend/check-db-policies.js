const db = require('./config/db.pg');

async function main() {
    try {
        const result = await db.query(`
            SELECT
                schemaname,
                tablename,
                policyname,
                roles,
                cmd,
                qual,
                with_check
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname
        `);

        console.table(result.rows);
        console.log('Jumlah policy:', result.rowCount);

    } catch (error) {
        console.error('Pemeriksaan gagal:', error.message);
    } finally {
        await db.end();
    }
}

main();
