const db = require('./config/db.pg');

async function checkRole() {
    try {
        const result = await db.query(`
            SELECT
                current_user,
                session_user,
                current_database(),
                r.rolsuper,
                r.rolbypassrls
            FROM pg_roles r
            WHERE r.rolname = current_user
        `);

        console.table(result.rows);
    } catch (error) {
        console.error('Pemeriksaan gagal:', error.message);
    } finally {
        await db.end();
    }
}

checkRole();
