const mysqlDb = require('../config/db');
const pgPool = require('../config/db.pg');

const tables = [
    'about_profiles', 'head_history', 'hero_backgrounds',
    'galleries', 'posts', 'faqs', 'site_settings',
    'test_services', 'non_test_programs', 'complaints',
    'ebooks', 'quiz_packages', 'quiz_subtopics',
    'quiz_settings', 'majors', 'surveys', 'users',
    'complaint_histories', 'quiz_questions',
    'quiz_recommendations', 'registrations',
    'schedule_batches', 'schedules',
    'schedule_participants', 'schedule_histories'
];

async function main() {
    let failed = false;

    try {
        const identity = await pgPool.query(
            'SELECT current_user, current_database()'
        );

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error('Dihentikan: role bukan epd1_app.');
        }

        console.log('Role:', identity.rows[0].current_user);
        console.log('Database:', identity.rows[0].current_database);
        console.log('\nAUDIT KESESUAIAN KOLOM EPD1\n');

        for (const table of tables) {
            const [mysqlColumns] = await mysqlDb.query(
                `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?
                 ORDER BY ORDINAL_POSITION`,
                [table]
            );

            const pgColumns = await pgPool.query(
                `SELECT column_name, data_type, udt_name
                 FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = $1
                 ORDER BY ordinal_position`,
                [table]
            );

            const sourceNames = mysqlColumns.map(c => c.COLUMN_NAME);
            const targetNames = pgColumns.rows.map(c => c.column_name);

            const sameNames =
                JSON.stringify(sourceNames) === JSON.stringify(targetNames);

            console.log(
                `${sameNames ? 'OK' : 'PERIKSA'} ${table} ` +
                `| MySQL: ${sourceNames.length} kolom` +
                ` | Supabase: ${targetNames.length} kolom`
            );

            if (!sameNames) {
                failed = true;
                console.log('  MySQL:', sourceNames.join(', '));
                console.log('  Supabase:', targetNames.join(', '));
            }
        }

        console.log('\n================================');
        console.log('Total tabel diperiksa:', tables.length);
        console.log('Hasil:', failed
            ? 'ADA PERBEDAAN NAMA/URUTAN KOLOM'
            : 'SEMUA NAMA DAN URUTAN KOLOM COCOK'
        );
        console.log('Tidak ada data yang ditulis atau diubah.');

        if (failed) process.exitCode = 1;

    } catch (error) {
        console.error('\nAUDIT GAGAL:', error.message);
        process.exitCode = 1;
    } finally {
        await Promise.allSettled([
            mysqlDb.end(),
            pgPool.end()
        ]);
    }
}

main();
