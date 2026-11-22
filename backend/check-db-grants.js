const db = require('./config/db.pg');

async function main() {
    try {
        const result = await db.query(`
            SELECT
                CASE
                    WHEN table_name IN (
                        'about_profiles', 'head_history',
                        'hero_backgrounds', 'galleries', 'posts',
                        'faqs', 'site_settings', 'test_services',
                        'non_test_programs', 'complaints',
                        'ebooks', 'quiz_packages', 'quiz_subtopics',
                        'quiz_settings', 'majors', 'surveys',
                        'users', 'complaint_histories',
                        'quiz_questions', 'quiz_recommendations',
                        'registrations', 'schedule_batches',
                        'schedules', 'schedule_participants',
                        'schedule_histories'
                    ) THEN 'EPD1'
                    ELSE 'EPD2'
                END AS kelompok,
                grantee,
                privilege_type,
                COUNT(DISTINCT table_name) AS jumlah_tabel
            FROM information_schema.table_privileges
            WHERE table_schema = 'public'
            GROUP BY kelompok, grantee, privilege_type
            ORDER BY kelompok, grantee, privilege_type
        `);

        console.table(result.rows);
    } catch (error) {
        console.error('Pemeriksaan gagal:', error.message);
    } finally {
        await db.end();
    }
}

main();
