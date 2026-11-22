require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: 'epd1_app.aquqdodntgzjdfcvxgbs',
    password: process.env.EPD1_APP_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 1
});

const tables = [
    'about_profiles',
    'complaint_histories',
    'complaints',
    'ebooks',
    'faqs',
    'galleries',
    'head_history',
    'hero_backgrounds',
    'majors',
    'non_test_programs',
    'posts',
    'quiz_packages',
    'quiz_questions',
    'quiz_recommendations',
    'quiz_settings',
    'quiz_subtopics',
    'registrations',
    'schedule_batches',
    'schedule_histories',
    'schedule_participants',
    'schedules',
    'site_settings',
    'surveys',
    'test_services',
    'users'
];

async function check() {
    try {
        const results = [];

        for (const table of tables) {
            const result = await pool.query(
                `SELECT COUNT(*)::int AS total FROM public."${table}"`
            );

            results.push({
                table,
                total_data: result.rows[0].total
            });
        }

        console.log('\nJUMLAH DATA 25 TABEL EPD1 DI SUPABASE:');
        console.table(results);

        console.log(
            'TOTAL SELURUH DATA:',
            results.reduce((sum, item) => sum + item.total_data, 0)
        );
    } catch (error) {
        console.error('PEMERIKSAAN GAGAL:', error.message);
    } finally {
        await pool.end();
    }
}

check();
