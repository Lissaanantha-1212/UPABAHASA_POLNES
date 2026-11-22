const mysqlDb = require('../config/db');
const pgPool = require('../config/db.pg');

const COMMIT_MODE = process.argv.includes('--commit');

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

const expectedCounts = {
    about_profiles: 0,
    complaints: 0,
    complaint_histories: 0,
    ebooks: 8,
    faqs: 0,
    galleries: 0,
    head_history: 0,
    hero_backgrounds: 0,
    posts: 0,
    site_settings: 0,
    test_services: 3,
    non_test_programs: 3,
    quiz_packages: 3,
    quiz_questions: 23,
    quiz_recommendations: 0,
    quiz_settings: 9,
    quiz_subtopics: 10,
    registrations: 1,
    schedule_batches: 0,
    schedule_histories: 0,
    schedule_participants: 0,
    schedules: 0,
    majors: 28,
    surveys: 3,
    users: 1
};

function mysqlQuote(name) {
    return '`' + name.replace(/`/g, '``') + '`';
}

function pgQuote(name) {
    return '"' + name.replace(/"/g, '""') + '"';
}

function formatCount(value) {
    return Number(value);
}

async function main() {
    let sourceConn;
    let pgClient;
    let pgTransactionStarted = false;
    let sourceTransactionStarted = false;

    try {
        console.log('\n======================================');
        console.log('MIGRASI DATA EPD1 KE SUPABASE');
        console.log('MODE:', COMMIT_MODE ? 'COMMIT' : 'DRY RUN');
        console.log('======================================\n');

        // 1. Pastikan koneksi PostgreSQL menggunakan role EPD1.
        const identity = await pgPool.query(`
            SELECT current_user, current_database()
        `);

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error(
                'Dihentikan: koneksi Supabase bukan menggunakan epd1_app.'
            );
        }

        console.log('Role Supabase:', identity.rows[0].current_user);
        console.log('Database:', identity.rows[0].current_database);

        // 2. Buka transaksi baca-saja pada sumber MySQL.
        sourceConn = await mysqlDb.getConnection();

        await sourceConn.query(
            'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ'
        );

        await sourceConn.beginTransaction();
        sourceTransactionStarted = true;

        const sourceData = new Map();
        const sourceMetadata = new Map();
        let totalSourceRows = 0;

        console.log('\nMEMBACA DATA SUMBER MYSQL\n');

        // 3. Baca seluruh tabel berdasarkan urutan relasi.
        for (const table of tables) {
            const [columns] = await sourceConn.query(`
                SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            `, [table]);

            if (columns.length === 0) {
                throw new Error(`Tabel MySQL tidak ditemukan: ${table}`);
            }

            const [targetColumns] = await pgClientlessQuery(table);

            if (columns.length !== targetColumns.length) {
                throw new Error(
                    `Jumlah kolom berbeda pada tabel ${table}.`
                );
            }

            for (let i = 0; i < columns.length; i++) {
                if (
                    columns[i].COLUMN_NAME !==
                    targetColumns[i].column_name
                ) {
                    throw new Error(
                        `Urutan/nama kolom berbeda pada ${table}.`
                    );
                }
            }

            const expressions = columns.map(column => {
                const name = mysqlQuote(column.COLUMN_NAME);
                const type = column.DATA_TYPE.toLowerCase();

                if (
                    ['date', 'time', 'datetime', 'timestamp'].includes(type)
                ) {
                    return `CAST(${name} AS CHAR) AS ${name}`;
                }

                return name;
            });

            const [rows] = await sourceConn.query(
                `SELECT ${expressions.join(', ')}
                 FROM ${mysqlQuote(table)}
                 ORDER BY ${mysqlQuote('id')}`
            );

            const expected = expectedCounts[table];

            if (rows.length !== expected) {
                throw new Error(
                    `Jumlah data sumber berubah pada ${table}. ` +
                    `Harusnya ${expected}, ditemukan ${rows.length}.`
                );
            }

            sourceData.set(table, rows);
            sourceMetadata.set(table, columns);
            totalSourceRows += rows.length;

            console.log(`${table}: ${rows.length} baris`);
        }

        if (totalSourceRows !== 92) {
            throw new Error(
                `Total sumber tidak sesuai. Ditemukan ${totalSourceRows}, seharusnya 92.`
            );
        }

        // 4. Periksa seluruh tabel tujuan masih kosong.
        console.log('\nMEMERIKSA TABEL TUJUAN SUPABASE\n');

        const targetCounts = {};

        for (const table of tables) {
            const result = await pgPool.query(
                `SELECT COUNT(*)::int AS total
                 FROM public.${pgQuote(table)}`
            );

            const count = formatCount(result.rows[0].total);
            targetCounts[table] = count;

            if (count !== 0) {
                throw new Error(
                    `Tabel tujuan ${table} tidak kosong (${count} baris). ` +
                    'Migrasi dihentikan.'
                );
            }

            console.log(`${table}: ${count} baris`);
        }

        // 5. Mode simulasi: berhenti tanpa menulis data.
        if (!COMMIT_MODE) {
            console.log('\n======================================');
            console.log('DRY RUN BERHASIL');
            console.log('======================================');
            console.log('Total tabel:', tables.length);
            console.log('Total data sumber:', totalSourceRows);
            console.log('Total data tujuan saat ini: 0');
            console.log('Data belum dipindahkan.');
            console.log('Tidak ada perubahan pada database.');
            console.log('\nUntuk migrasi sebenarnya, diperlukan --commit.');
            return;
        }

        // 6. Mulai transaksi PostgreSQL.
        pgClient = await pgPool.connect();

        await pgClient.query(
            'BEGIN ISOLATION LEVEL SERIALIZABLE'
        );
        pgTransactionStarted = true;

        // Periksa ulang kondisi tabel tujuan di dalam transaksi.
        for (const table of tables) {
            const result = await pgClient.query(
                `SELECT COUNT(*)::int AS total
                 FROM public.${pgQuote(table)}`
            );

            if (formatCount(result.rows[0].total) !== 0) {
                throw new Error(
                    `Tabel ${table} tidak kosong saat transaksi dimulai.`
                );
            }
        }

        // 7. INSERT biasa, tanpa UPSERT, UPDATE, DELETE, atau TRUNCATE.
        console.log('\nMEMINDAHKAN DATA EPD1\n');

        for (const table of tables) {
            const rows = sourceData.get(table);
            const columns = sourceMetadata.get(table);

            if (rows.length === 0) {
                console.log(`${table}: dilewati (0 baris)`);
                continue;
            }

            const columnNames = columns.map(c => c.COLUMN_NAME);

            const insertColumns = columnNames
                .map(pgQuote)
                .join(', ');

            for (const row of rows) {
                const values = columnNames.map(name => {
                    let value = row[name];

                    if (value === undefined) return null;

                    const sourceColumn = columns.find(
                        c => c.COLUMN_NAME === name
                    );

                    // Konversi MySQL tinyint(1) ke PostgreSQL boolean.
                    if (
                        sourceColumn.DATA_TYPE.toLowerCase() === 'tinyint' &&
                        /^tinyint\(1\)/i.test(sourceColumn.COLUMN_TYPE)
                    ) {
                        if (value === null) return null;

                        if (value === 0 || value === '0') return false;
                        if (value === 1 || value === '1') return true;

                        throw new Error(
                            `Nilai boolean tidak valid: ${table}.${name}`
                        );
                    }

                    return value;
                });

                const placeholders = values
                    .map((_, index) => `$${index + 1}`)
                    .join(', ');

                await pgClient.query(
                    `INSERT INTO public.${pgQuote(table)}
                     (${insertColumns})
                     VALUES (${placeholders})`,
                    values
                );
            }

            console.log(`${table}: ${rows.length} baris dimasukkan`);
        }

        // 8. Verifikasi seluruh jumlah data sebelum COMMIT.
        console.log('\nVERIFIKASI DALAM TRANSAKSI\n');

        for (const table of tables) {
            const result = await pgClient.query(
                `SELECT COUNT(*)::int AS total
                 FROM public.${pgQuote(table)}`
            );

            const actual = formatCount(result.rows[0].total);
            const expected = expectedCounts[table];

            if (actual !== expected) {
                throw new Error(
                    `Jumlah data tidak cocok pada ${table}: ` +
                    `${actual} dari ${expected}.`
                );
            }

            console.log(`OK ${table}: ${actual}/${expected}`);
        }

        // 9. Commit hanya setelah seluruh pemeriksaan berhasil.
        await pgClient.query('COMMIT');
        pgTransactionStarted = false;

        console.log('\n======================================');
        console.log('MIGRASI DATA BERHASIL DI-COMMIT');
        console.log('======================================');
        console.log('Total tabel:', tables.length);
        console.log('Total baris:', totalSourceRows);
        console.log('Tidak ada perintah perubahan pada EPD2.');
        console.log(
            'CATATAN: Sequence ID belum disesuaikan. ' +
            'Jangan jalankan aplikasi untuk INSERT baru sebelum tahap sequence selesai.'
        );

    } catch (error) {
        if (pgTransactionStarted && pgClient) {
            try {
                await pgClient.query('ROLLBACK');
                console.log('\nTransaksi PostgreSQL berhasil di-ROLLBACK.');
            } catch (rollbackError) {
                console.error(
                    'Peringatan: rollback PostgreSQL gagal:',
                    rollbackError.message
                );
            }
        }

        console.error('\nMIGRASI DIHENTIKAN:', error.message);
        process.exitCode = 1;

    } finally {
        if (sourceTransactionStarted && sourceConn) {
            try {
                await sourceConn.rollback();
            } catch (_) {}
        }

        if (sourceConn) sourceConn.release();
        if (pgClient) pgClient.release();

        await Promise.allSettled([
            mysqlDb.end(),
            pgPool.end()
        ]);
    }
}

// Membaca metadata tujuan tanpa menulis data.
async function pgClientlessQuery(table) {
    const result = await pgPool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
    );

    return [result.rows];
}

main();
