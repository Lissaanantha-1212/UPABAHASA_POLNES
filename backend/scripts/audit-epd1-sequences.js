const pool = require('../config/db.pg');

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
    try {
        const identity = await pool.query(
            'SELECT current_user'
        );

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error('Role bukan epd1_app. Audit dihentikan.');
        }

        console.log('Role:', identity.rows[0].current_user);
        console.log('\nAUDIT SEQUENCE EPD1 (READ-ONLY)\n');

        let problems = 0;

        for (const table of tables) {
            const result = await pool.query(`
                SELECT
                    pg_get_serial_sequence(
                        format('public.%I', $1::text), 'id'
                    ) AS sequence_name,
                    (SELECT MAX(id)
                     FROM public."${table}") AS max_id
            `, [table]);

            const sequence = result.rows[0].sequence_name;
            const maxId = result.rows[0].max_id;

            if (!sequence) {
                problems++;
                console.log(
                    'MASALAH', table,
                    '| Sequence tidak ditemukan'
                );
            } else {
                console.log(
                    'OK', table,
                    '| Sequence:', sequence,
                    '| MAX(id):', maxId ?? 'NULL'
                );
            }
        }

        console.log('\nTabel diperiksa:', tables.length);
        console.log('Masalah:', problems);
        console.log('Tidak ada data atau sequence yang diubah.');

        if (problems > 0) process.exitCode = 1;

    } catch (error) {
        console.error('AUDIT GAGAL:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
