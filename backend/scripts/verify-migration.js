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

const relations = [
    ['complaint_histories', 'complaint_id', 'complaints', 'id'],
    ['quiz_questions', 'package_id', 'quiz_packages', 'id'],
    ['quiz_questions', 'subtopic_id', 'quiz_subtopics', 'id'],
    ['quiz_recommendations', 'subtopic_id', 'quiz_subtopics', 'id'],
    ['registrations', 'major_id', 'majors', 'id'],
    ['registrations', 'program_id', 'non_test_programs', 'id'],
    ['schedule_batches', 'program_id', 'non_test_programs', 'id'],
    ['schedules', 'batch_id', 'schedule_batches', 'id'],
    ['schedules', 'program_id', 'non_test_programs', 'id'],
    ['schedule_histories', 'schedule_id', 'schedules', 'id'],
    ['schedule_participants', 'registration_id', 'registrations', 'id'],
    ['schedule_participants', 'schedule_id', 'schedules', 'id']
];

const q = name => '"' + name.replace(/"/g, '""') + '"';

async function main() {
    let mismatches = 0;
    let total = 0;

    try {
        const identity = await pgPool.query(
            'SELECT current_user, current_database()'
        );

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error('Role Supabase bukan epd1_app.');
        }

        console.log('Role:', identity.rows[0].current_user);
        console.log('\nVERIFIKASI JUMLAH DATA\n');

        for (const table of tables) {
            const [source] = await mysqlDb.query(
                `SELECT COUNT(*) AS total FROM \`${table}\``
            );

            const target = await pgPool.query(
                `SELECT COUNT(*)::int AS total
                 FROM public.${q(table)}`
            );

            const a = Number(source[0].total);
            const b = Number(target.rows[0].total);
            total += b;

            const ok = a === b;

            console.log(
                `${ok ? 'OK' : 'SELISIH'} ${table}: MySQL ${a} | Supabase ${b}`
            );

            if (!ok) mismatches++;
        }

        console.log('\nVERIFIKASI FOREIGN KEY SUPABASE\n');

        let orphanCount = 0;

        for (const [child, fk, parent, pk] of relations) {
            const result = await pgPool.query(`
                SELECT COUNT(*)::int AS total
                FROM public.${q(child)} c
                LEFT JOIN public.${q(parent)} p
                    ON c.${q(fk)} = p.${q(pk)}
                WHERE c.${q(fk)} IS NOT NULL
                  AND p.${q(pk)} IS NULL
            `);

            const count = Number(result.rows[0].total);
            console.log(
                `${count === 0 ? 'OK' : 'MASALAH'} ${child}.${fk}: ${count} orphan`
            );

            orphanCount += count;
        }

        console.log('\n================================');
        console.log('Total baris Supabase:', total);
        console.log('Tabel dengan selisih:', mismatches);
        console.log('Total orphan:', orphanCount);

        if (mismatches === 0 && orphanCount === 0 && total === 92) {
            console.log('HASIL: VERIFIKASI PASCA-MIGRASI LOLOS.');
        } else {
            console.log('HASIL: PERLU PEMERIKSAAN LANJUT.');
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('VERIFIKASI GAGAL:', error.message);
        process.exitCode = 1;
    } finally {
        await Promise.allSettled([
            mysqlDb.end(),
            pgPool.end()
        ]);
    }
}

main();
