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

function expectedType(column) {
    const type = column.DATA_TYPE.toLowerCase();
    const detail = column.COLUMN_TYPE.toLowerCase();

    if (type === 'tinyint' && detail === 'tinyint(1)') return 'boolean';
    if (type === 'tinyint') return 'smallint';
    if (['int', 'integer'].includes(type)) return 'integer';
    if (type === 'bigint') return 'bigint';
    if (type === 'smallint') return 'smallint';
    if (['varchar', 'char', 'enum', 'set'].includes(type)) {
        return 'character varying';
    }
    if (['text', 'tinytext', 'mediumtext', 'longtext'].includes(type)) {
        return 'text';
    }
    if (['datetime', 'timestamp'].includes(type)) {
        return 'timestamp without time zone';
    }
    if (type === 'date') return 'date';
    if (type === 'time') return 'time without time zone';
    if (['decimal', 'numeric'].includes(type)) return 'numeric';
    if (type === 'float') return 'real';
    if (type === 'double') return 'double precision';
    if (type === 'json') return 'jsonb';
    return 'PERLU DITINJAU';
}

async function main() {
    try {
        const identity = await pgPool.query(
            'SELECT current_user, current_database()'
        );

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error('Dihentikan: role bukan epd1_app.');
        }

        let mismatchCount = 0;
        let checkedCount = 0;

        console.log('Role:', identity.rows[0].current_user);
        console.log('\nAUDIT TIPE DATA EPD1\n');

        for (const table of tables) {
            const [source] = await mysqlDb.query(
                `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?
                 ORDER BY ORDINAL_POSITION`,
                [table]
            );

            const target = await pgPool.query(
                `SELECT column_name, data_type, udt_name
                 FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = $1
                 ORDER BY ordinal_position`,
                [table]
            );

            for (let i = 0; i < source.length; i++) {
                checkedCount++;

                const src = source[i];
                const dst = target.rows[i];

                if (!dst) {
                    mismatchCount++;
                    console.log('KOLOM TUJUAN TIDAK ADA:', table, src.COLUMN_NAME);
                    continue;
                }

                const expected = expectedType(src);
                const actual = dst.data_type.toLowerCase();

                if (expected !== actual) {
                    mismatchCount++;
                    console.log(
                        'PERLU DITINJAU:',
                        `${table}.${src.COLUMN_NAME}`,
                        `| MySQL: ${src.COLUMN_TYPE}`,
                        `| Ekspektasi: ${expected}`,
                        `| Supabase: ${actual} (${dst.udt_name})`
                    );
                }
            }
        }

        console.log('\n================================');
        console.log('Kolom diperiksa:', checkedCount);
        console.log('Perbedaan/perlu tinjau:', mismatchCount);
        console.log(
            mismatchCount === 0
                ? 'Hasil: semua tipe sesuai pemetaan awal.'
                : 'Hasil: ada tipe yang perlu ditinjau sebelum migrasi.'
        );
        console.log('Tidak ada data yang ditulis atau diubah.');

        if (mismatchCount > 0) process.exitCode = 1;

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
