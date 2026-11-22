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

function quoteMySQL(name) {
    return '`' + name.replace(/`/g, '``') + '`';
}

async function main() {
    let issues = 0;
    let checked = 0;

    try {
        const identity = await pgPool.query(
            'SELECT current_user, current_database()'
        );

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error('Dihentikan: role bukan epd1_app.');
        }

        console.log('Role:', identity.rows[0].current_user);
        console.log('\nAUDIT NILAI DATA EPD1\n');

        for (const table of tables) {
            const [sourceColumns] = await mysqlDb.query(
                `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?`,
                [table]
            );

            const targetResult = await pgPool.query(
                `SELECT column_name, is_nullable,
                        character_maximum_length, data_type
                 FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = $1`,
                [table]
            );

            const targetMap = new Map(
                targetResult.rows.map(c => [c.column_name, c])
            );

            for (const src of sourceColumns) {
                const dst = targetMap.get(src.COLUMN_NAME);
                if (!dst) continue;

                const col = quoteMySQL(src.COLUMN_NAME);

                // Periksa kolom wajib di Supabase.
                if (dst.is_nullable === 'NO') {
                    const [result] = await mysqlDb.query(
                        `SELECT COUNT(*) AS total
                         FROM ${quoteMySQL(table)}
                         WHERE ${col} IS NULL`
                    );

                    checked++;

                    if (Number(result[0].total) > 0) {
                        issues++;
                        console.log(
                            'NULL TIDAK DIIZINKAN:',
                            `${table}.${src.COLUMN_NAME}`,
                            '| Jumlah:', result[0].total
                        );
                    }
                }

                // Periksa panjang teks terhadap batas Supabase.
                if (
                    dst.character_maximum_length &&
                    ['varchar', 'char', 'enum', 'set'].includes(
                        src.DATA_TYPE.toLowerCase()
                    )
                ) {
                    const [result] = await mysqlDb.query(
                        `SELECT COUNT(*) AS total
                         FROM ${quoteMySQL(table)}
                         WHERE ${col} IS NOT NULL
                           AND CHAR_LENGTH(${col}) > ?`,
                        [dst.character_maximum_length]
                    );

                    checked++;

                    if (Number(result[0].total) > 0) {
                        issues++;
                        console.log(
                            'TEKS MELEBIHI BATAS:',
                            `${table}.${src.COLUMN_NAME}`,
                            '| Batas:', dst.character_maximum_length,
                            '| Jumlah:', result[0].total
                        );
                    }
                }

                // Periksa nilai tinyint(1) yang dipetakan menjadi boolean.
                if (
                    src.DATA_TYPE.toLowerCase() === 'tinyint' &&
                    src.COLUMN_TYPE.toLowerCase() === 'tinyint(1)' &&
                    dst.data_type === 'boolean'
                ) {
                    const [result] = await mysqlDb.query(
                        `SELECT COUNT(*) AS total
                         FROM ${quoteMySQL(table)}
                         WHERE ${col} IS NOT NULL
                           AND ${col} NOT IN (0, 1)`
                    );

                    checked++;

                    if (Number(result[0].total) > 0) {
                        issues++;
                        console.log(
                            'BOOLEAN TIDAK VALID:',
                            `${table}.${src.COLUMN_NAME}`,
                            '| Jumlah:', result[0].total
                        );
                    }
                }
            }

            console.log('Selesai:', table);
        }

        console.log('\n================================');
        console.log('Pemeriksaan nilai:', checked);
        console.log('Temuan:', issues);
        console.log(
            issues === 0
                ? 'HASIL: Tidak ditemukan pelanggaran pemeriksaan.'
                : 'HASIL: Ada nilai yang perlu diperiksa sebelum migrasi.'
        );
        console.log('Tidak ada data yang ditulis atau diubah.');

        if (issues > 0) process.exitCode = 1;

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
