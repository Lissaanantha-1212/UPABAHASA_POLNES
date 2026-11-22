const mysqlDb = require('../config/db');
const pgPool = require('../config/db.pg');

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

async function main() {
    let problems = 0;

    try {
        const identity = await pgPool.query(
            'SELECT current_user, current_database()'
        );

        if (identity.rows[0].current_user !== 'epd1_app') {
            throw new Error('Dihentikan: role bukan epd1_app.');
        }

        console.log('Role Supabase:', identity.rows[0].current_user);
        console.log('\nAUDIT FOREIGN KEY DATA SUMBER\n');

        for (const [child, fk, parent, pk] of relations) {
            const [rows] = await mysqlDb.query(`
                SELECT COUNT(*) AS total
                FROM \`${child}\` c
                LEFT JOIN \`${parent}\` p ON c.\`${fk}\` = p.\`${pk}\`
                WHERE c.\`${fk}\` IS NOT NULL
                  AND p.\`${pk}\` IS NULL
            `);

            const total = Number(rows[0].total);

            console.log(
                `${total === 0 ? 'OK' : 'MASALAH'} ` +
                `${child}.${fk} -> ${parent}.${pk}: ${total} orphan`
            );

            if (total > 0) problems++;
        }

        console.log('\n================================');
        console.log('Relasi diperiksa:', relations.length);
        console.log('Relasi bermasalah:', problems);
        console.log(
            problems === 0
                ? 'HASIL: SEMUA RELASI VALID.'
                : 'HASIL: ADA RELASI YANG PERLU DIPERIKSA.'
        );
        console.log('Tidak ada data yang ditulis atau diubah.');

        if (problems > 0) process.exitCode = 1;

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
