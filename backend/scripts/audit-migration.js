const mysqlDb = require('../config/db');
const pgPool = require('../config/db.pg');

const tables = [
    'about_profiles',
    'head_history',
    'hero_backgrounds',
    'galleries',
    'posts',
    'faqs',
    'site_settings',
    'test_services',
    'non_test_programs',
    'complaints',
    'ebooks',
    'quiz_packages',
    'quiz_subtopics',
    'quiz_settings',
    'majors',
    'surveys',
    'users',
    'complaint_histories',
    'quiz_questions',
    'quiz_recommendations',
    'registrations',
    'schedule_batches',
    'schedules',
    'schedule_participants',
    'schedule_histories'
];

async function main() {
    let mysqlTotal = 0;
    let supabaseTotal = 0;
    const results = [];

    try {
        console.log('\n========================================');
        console.log('   AUDIT DRY RUN MIGRASI EPD1');
        console.log('========================================');

        // 1. Periksa koneksi MySQL
        const [mysqlInfo] = await mysqlDb.query(
            'SELECT DATABASE() AS database_name, @@port AS port'
        );

        console.log('\n[MYSQL]');
        console.log('Database:', mysqlInfo[0].database_name);
        console.log('Port:', mysqlInfo[0].port);

        // 2. Periksa koneksi dan identitas Supabase
        const pgInfo = await pgPool.query(`
            SELECT current_user, current_database()
        `);

        const role = pgInfo.rows[0].current_user;

        console.log('\n[SUPABASE]');
        console.log('Database:', pgInfo.rows[0].current_database);
        console.log('Role:', role);

        if (role !== 'epd1_app') {
            throw new Error(
                'AUDIT DIHENTIKAN: Role Supabase bukan epd1_app.'
            );
        }

        // 3. Hitung data setiap tabel EPD1
        console.log('\n[PEMERIKSAAN JUMLAH DATA]');
        console.log(
            'Tabel'.padEnd(27) +
            'MySQL'.padStart(10) +
            'Supabase'.padStart(12)
        );

        for (const table of tables) {
            const [source] = await mysqlDb.query(
                `SELECT COUNT(*) AS total FROM \`${table}\``
            );

            const target = await pgPool.query(
                `SELECT COUNT(*) AS total FROM public."${table}"`
            );

            const sourceCount = Number(source[0].total);
            const targetCount = Number(target.rows[0].total);

            mysqlTotal += sourceCount;
            supabaseTotal += targetCount;

            results.push({
                table,
                sourceCount,
                targetCount
            });

            console.log(
                table.padEnd(27) +
                String(sourceCount).padStart(10) +
                String(targetCount).padStart(12)
            );
        }

        console.log('\n========================================');
        console.log('TOTAL MYSQL    :', mysqlTotal);
        console.log('TOTAL SUPABASE :', supabaseTotal);
        console.log('========================================');

        const sourceCorrect = mysqlTotal === 92;
        const targetEmpty = supabaseTotal === 0;
        const allTablesRead = results.length === 25;

        console.log('\n[HASIL PEMERIKSAAN]');
        console.log('25 tabel berhasil diperiksa:', allTablesRead);
        console.log('Total sumber sesuai 92:', sourceCorrect);
        console.log('Seluruh tujuan masih kosong:', targetEmpty);

        if (sourceCorrect && targetEmpty && allTablesRead) {
            console.log(
                '\nSTATUS: LOLOS AUDIT AWAL DRY RUN.'
            );
            console.log(
                'Belum ada data yang ditulis atau diubah.'
            );
        } else {
            console.log(
                '\nSTATUS: BELUM LOLOS. Migrasi tidak boleh dilanjutkan.'
            );
        }

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
