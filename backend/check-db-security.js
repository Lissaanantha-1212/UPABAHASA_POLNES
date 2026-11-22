const db = require('./config/db.pg');

async function main() {
    try {
        console.log('\n=== 1. INFORMASI ROLE ===');
        const roles = await db.query(`
            SELECT rolname, rolsuper, rolbypassrls,
                   rolcreaterole, rolcreatedb, rolcanlogin
            FROM pg_roles
            WHERE rolname IN (
                'postgres', 'anon', 'authenticated', 'service_role'
            )
            ORDER BY rolname
        `);
        console.table(roles.rows);

        console.log('\n=== 2. PEMILIK DAN STATUS TABEL ===');
        const tables = await db.query(`
            SELECT
                c.relname AS nama_tabel,
                r.rolname AS pemilik,
                c.relrowsecurity AS rls_aktif,
                c.relforcerowsecurity AS force_rls
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_roles r ON r.oid = c.relowner
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
            ORDER BY c.relname
        `);
        console.table(tables.rows);

        console.log('\n=== 3. KEPEMILIKAN SEQUENCE ===');
        const sequences = await db.query(`
            SELECT
                c.relname AS nama_sequence,
                r.rolname AS pemilik
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_roles r ON r.oid = c.relowner
            WHERE n.nspname = 'public'
              AND c.relkind = 'S'
            ORDER BY c.relname
        `);
        console.table(sequences.rows);

    } catch (error) {
        console.error('Pemeriksaan gagal:', error.message);
    } finally {
        await db.end();
    }
}

main();
