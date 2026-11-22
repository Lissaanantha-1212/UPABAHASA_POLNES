const db = require('../config/db.pg');
const crypto = require('crypto');
const storageService = require('../services/storageService');

const BANK_AUDIO_BUCKET = 'quiz-audio';

const BANK_AUDIO_EXTENSIONS = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a'
};

const getBankAudioDuration = async (file) => {
    if (
        !file ||
        !Buffer.isBuffer(file.buffer) ||
        !BANK_AUDIO_EXTENSIONS[file.mimetype]
    ) {
        throw new Error('File audio bank Kuis tidak valid.');
    }

    try {
        const { parseBuffer } = await import('music-metadata');
        const metadata = await parseBuffer(file.buffer, file.mimetype);
        const duration = metadata.format.duration;

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error('Durasi audio tidak valid.');
        }

        return Math.ceil(duration);
    } catch (error) {
        throw new Error('Gagal membaca durasi file audio.');
    }
};

const uploadBankAudio = async (file, folder) => {
    if (!['packages', 'questions'].includes(folder)) {
        throw new Error('Folder audio bank tidak valid.');
    }

    const duration = await getBankAudioDuration(file);
    const extension = BANK_AUDIO_EXTENSIONS[file.mimetype];
    const objectPath = `bank/${folder}/${crypto.randomUUID()}${extension}`;

    await storageService.uploadObject({
        bucket: BANK_AUDIO_BUCKET,
        objectPath,
        fileBuffer: file.buffer,
        contentType: file.mimetype === 'audio/mp3'
            ? 'audio/mpeg'
            : file.mimetype,
        upsert: false
    });

    return { objectPath, duration };
};

const formatBankAudioUrl = (objectPath) => {
    if (
        typeof objectPath !== 'string' ||
        !/^bank\/(packages|questions)\/[0-9a-f-]+\.(mp3|wav|m4a)$/i.test(objectPath)
    ) {
        return null;
    }

    return storageService.getPublicUrl(BANK_AUDIO_BUCKET, objectPath);
};

const removeBankAudioIfUnreferenced = async (objectPath) => {
    if (
        typeof objectPath !== 'string' ||
        !/^bank\/(packages|questions)\/[0-9a-f-]+\.(mp3|wav|m4a)$/i.test(objectPath)
    ) {
        return false;
    }

    try {
        const result = await db.query(
            `SELECT
                (
                    SELECT COUNT(*)
                    FROM public.quiz_packages
                    WHERE audio_file = $1
                ) +
                (
                    SELECT COUNT(*)
                    FROM public.quiz_questions
                    WHERE audio_file = $1
                ) AS total`,
            [objectPath]
        );

        if (Number(result.rows[0].total) > 0) {
            return false;
        }

        await storageService.removeObject(
            BANK_AUDIO_BUCKET,
            objectPath
        );

        return true;
    } catch (error) {
        console.error('Gagal membersihkan audio bank Kuis:', error.message);
        return false;
    }
};

const CATEGORIES = ['listening', 'reading', 'structure'];
const LEVELS = ['singkat', 'sedang', 'panjang'];

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const parseOptions = (value) => {
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    return null;
};

const formatQuestion = (row) => ({
    ...row,
    options: parseOptions(row.options),
    audio_url: formatBankAudioUrl(row.audio_file)
});

const validCategory = (value) => CATEGORIES.includes(value);
const validLevel = (value) => LEVELS.includes(value);

const validateQuestion = (data) => {
    const options = parseOptions(data.options);

    if (!data.question_text || !String(data.question_text).trim()) {
        return 'Teks pertanyaan wajib diisi.';
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
        return 'Pilihan jawaban harus berjumlah 2 sampai 4.';
    }

    const letters = options.map((item) =>
        String(item?.label || '').toUpperCase()
    );

    const expected = ['A', 'B', 'C', 'D'].slice(0, options.length);

    if (
        letters.some((letter, index) => letter !== expected[index]) ||
        options.some((item) => !item?.text || !String(item.text).trim())
    ) {
        return 'Pilihan jawaban harus berurutan A sampai D dan tidak boleh kosong.';
    }

    const answer = String(data.correct_answer || '').toUpperCase();

    if (!expected.includes(answer)) {
        return 'Jawaban benar harus sesuai dengan pilihan yang tersedia.';
    }

    if (!data.subtopic_id || !Number.isInteger(Number(data.subtopic_id))) {
        return 'Subtopik wajib dipilih.';
    }

    return null;
};

const checkSubtopic = async (client, subtopicId, category) => {
    const result = await client.query(
        `SELECT id, category, name
         FROM public.quiz_subtopics
         WHERE id = $1 AND is_active = TRUE
         LIMIT 1
         FOR UPDATE`,
        [subtopicId]
    );

    const subtopic = result.rows[0];

    if (!subtopic) {
        return { error: 'Subtopik tidak ditemukan atau tidak aktif.' };
    }

    if (category && subtopic.category !== category) {
        return { error: 'Kategori subtopik tidak sesuai dengan kategori soal.' };
    }

    return { subtopic };
};

// ==========================================
// PAKET SOAL
// ==========================================

const getPackages = asyncHandler(async (req, res) => {
    const { category, status } = req.query;

    if (category && !validCategory(category)) {
        return res.status(400).json({
            message: 'Kategori tidak valid.'
        });
    }

    const conditions = [];
    const values = [];

    if (category) {
        values.push(category);
        conditions.push(`p.category = $${values.length}`);
    }

    if (status === 'active' || status === 'inactive') {
        values.push(status === 'active');
        conditions.push(`p.is_active = $${values.length}`);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await db.query(
        `SELECT
            p.*,
            COUNT(q.id) FILTER (
                WHERE q.is_active = TRUE
                  AND s.is_active = TRUE
                  AND s.category = p.category
            )::INTEGER AS question_count
         FROM public.quiz_packages p
         LEFT JOIN public.quiz_questions q
            ON q.package_id = p.id
         LEFT JOIN public.quiz_subtopics s
            ON s.id = q.subtopic_id
         ${where}
         GROUP BY p.id
         ORDER BY p.created_at DESC`,
        values
    );

    res.json({
        data: result.rows.map((row) => ({
            ...row,
            audio_url: formatBankAudioUrl(row.audio_file)
        }))
    });
});
const getPackageById = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'ID paket tidak valid.' });
    }

    const packageResult = await db.query(
        `SELECT * FROM public.quiz_packages WHERE id = $1 LIMIT 1`,
        [id]
    );

    if (!packageResult.rows.length) {
        return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    }

    const questions = await db.query(
        `SELECT q.*, s.name AS subtopic_name
         FROM public.quiz_questions q
         LEFT JOIN public.quiz_subtopics s ON s.id = q.subtopic_id
         WHERE q.package_id = $1
         ORDER BY q.id ASC`,
        [id]
    );

    res.json({
        data: {
            ...packageResult.rows[0],
            audio_url: formatBankAudioUrl(packageResult.rows[0].audio_file),
            questions: questions.rows.map(formatQuestion)
        }
    });
});

const createPackage = asyncHandler(async (req, res) => {
    const {
        category,
        reading_text,
        reading_instruction
    } = req.body;

    let questions = req.body.questions;

    if (typeof questions === 'string') {
        try {
            questions = JSON.parse(questions);
        } catch {
            return res.status(400).json({
                message: 'Format data soal tidak valid.'
            });
        }
    }

    if (!validCategory(category)) {
        return res.status(400).json({
            message: 'Kategori paket tidak valid.'
        });
    }

    if (!Array.isArray(questions) || questions.length < 1) {
        return res.status(400).json({
            message: 'Paket wajib memiliki minimal satu soal.'
        });
    }

    for (let index = 0; index < questions.length; index++) {
        const error = validateQuestion(questions[index]);

        if (error) {
            return res.status(400).json({
                message: `Soal ke-${index + 1}: ${error}`
            });
        }
    }

    let client;
    let uploadedAudio = null;
    let transactionStarted = false;

    try {
        client = await db.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        // Mengunci penomoran per kategori agar tidak bentrok
        // ketika beberapa admin membuat paket bersamaan.
        await client.query(
            `SELECT pg_advisory_xact_lock(
                hashtext('quiz_packages:' || $1)::BIGINT
            )`,
            [category]
        );

        const numberResult = await client.query(
            `SELECT
                COALESCE(
                    MAX(
                        (substring(name FROM '^Paket ([0-9]+)$'))::INTEGER
                    ),
                    0
                ) + 1 AS next_number
             FROM public.quiz_packages
             WHERE category = $1
               AND name ~ '^Paket [0-9]+$'`,
            [category]
        );

        const packageName = `Paket ${numberResult.rows[0].next_number}`;

        if (req.file) {
            uploadedAudio = await uploadBankAudio(
                req.file,
                'packages'
            );
        }

        const packageResult = await client.query(
            `INSERT INTO public.quiz_packages
                (category, name, audio_file,
                 audio_duration_seconds, reading_text,
                 reading_instruction, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, FALSE)
             RETURNING *`,
            [
                category,
                packageName,
                uploadedAudio?.objectPath || null,
                uploadedAudio?.duration || null,
                reading_text || null,
                reading_instruction || null
            ]
        );

        const newPackage = packageResult.rows[0];
        const insertedQuestions = [];

        for (let index = 0; index < questions.length; index++) {
            const question = questions[index];

            const subtopicCheck = await checkSubtopic(
                client,
                question.subtopic_id,
                category
            );

            if (subtopicCheck.error) {
                throw new Error(
                    `Soal ke-${index + 1}: ${subtopicCheck.error}`
                );
            }

            const result = await client.query(
                `INSERT INTO public.quiz_questions
                    (package_id, subtopic_id, subtopic,
                     question_text, options, correct_answer,
                     explanation, level, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, TRUE)
                 RETURNING *`,
                [
                    newPackage.id,
                    question.subtopic_id,
                    subtopicCheck.subtopic.name,
                    String(question.question_text).trim(),
                    JSON.stringify(parseOptions(question.options)),
                    String(question.correct_answer).toUpperCase(),
                    question.explanation || null
                ]
            );

            insertedQuestions.push(formatQuestion(result.rows[0]));
        }

        await client.query('COMMIT');
        transactionStarted = false;

        res.status(201).json({
            message: 'Paket dan seluruh soalnya berhasil dibuat sebagai draft.',
            data: {
                ...newPackage,
                audio_url: formatBankAudioUrl(newPackage.audio_file),
                questions: insertedQuestions
            }
        });
    } catch (error) {
        if (transactionStarted && client) {
            await client.query('ROLLBACK');
        }

        if (uploadedAudio?.objectPath) {
            await removeBankAudioIfUnreferenced(
                uploadedAudio.objectPath
            );
        }

        if (error.message.startsWith('Soal ke-')) {
            return res.status(400).json({
                message: error.message
            });
        }

        throw error;
    } finally {
        if (client) client.release();
    }
});
const updatePackage = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const {
        reading_text,
        reading_instruction,
        is_active,
        remove_audio
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'ID paket tidak valid.'
        });
    }

    const hasActiveUpdate =
        Object.prototype.hasOwnProperty.call(req.body, 'is_active');

    if (
        hasActiveUpdate &&
        ![true, false, 'true', 'false'].includes(is_active)
    ) {
        return res.status(400).json({
            message: 'Status paket tidak valid.'
        });
    }

    const requestedActive = hasActiveUpdate
        ? is_active === true || is_active === 'true'
        : null;

    const shouldRemoveAudio =
        remove_audio === true || remove_audio === 'true';

    if (req.file && shouldRemoveAudio) {
        return res.status(400).json({
            message: 'Pilih unggah audio baru atau hapus audio, bukan keduanya.'
        });
    }

    let client;
    let uploadedAudio = null;
    let oldAudioPath = null;
    let transactionStarted = false;

    try {
        client = await db.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        const packageResult = await client.query(
            `SELECT *
             FROM public.quiz_packages
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (!packageResult.rows.length) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(404).json({
                message: 'Paket tidak ditemukan.'
            });
        }

        const currentPackage = packageResult.rows[0];
        oldAudioPath = currentPackage.audio_file;

        const category = req.body.category === undefined
            ? currentPackage.category
            : req.body.category;

        if (!validCategory(category)) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                message: 'Kategori paket tidak valid.'
            });
        }

        const nextIsActive = hasActiveUpdate
            ? requestedActive
            : currentPackage.is_active;

        const childResult = await client.query(
            `SELECT
                q.id,
                q.is_active,
                s.category AS subtopic_category,
                s.is_active AS subtopic_is_active
             FROM public.quiz_questions q
             LEFT JOIN public.quiz_subtopics s
                ON s.id = q.subtopic_id
             WHERE q.package_id = $1
             ORDER BY q.id
             FOR UPDATE OF q`,
            [id]
        );

        const children = childResult.rows;

        if (category !== currentPackage.category) {
            const incompatible = children.some(
                question => question.subtopic_category !== category
            );

            if (incompatible) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Kategori paket tidak dapat diubah karena subtopik soal di dalamnya tidak sesuai.'
                });
            }
        }

        if (nextIsActive) {
            if (children.length === 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Paket kosong tidak dapat diaktifkan.'
                });
            }

            const invalidQuestion = children.some(
                question =>
                    question.is_active !== true ||
                    question.subtopic_is_active !== true ||
                    question.subtopic_category !== category
            );

            if (invalidQuestion) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Semua soal paket harus aktif dan memiliki subtopik aktif yang sesuai sebelum paket diaktifkan.'
                });
            }
        }

        if (req.file) {
            uploadedAudio = await uploadBankAudio(
                req.file,
                'packages'
            );
        }

        const nextAudioPath = uploadedAudio
            ? uploadedAudio.objectPath
            : shouldRemoveAudio
                ? null
                : currentPackage.audio_file;

        const nextAudioDuration = uploadedAudio
            ? uploadedAudio.duration
            : shouldRemoveAudio
                ? null
                : currentPackage.audio_duration_seconds;

        const nextReadingText =
            Object.prototype.hasOwnProperty.call(req.body, 'reading_text')
                ? (reading_text || null)
                : currentPackage.reading_text;

        const nextReadingInstruction =
            Object.prototype.hasOwnProperty.call(req.body, 'reading_instruction')
                ? (reading_instruction || null)
                : currentPackage.reading_instruction;

        const result = await client.query(
            `UPDATE public.quiz_packages
             SET category = $1,
                 audio_file = $2,
                 audio_duration_seconds = $3,
                 reading_text = $4,
                 reading_instruction = $5,
                 is_active = $6,
                 updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [
                category,
                nextAudioPath,
                nextAudioDuration,
                nextReadingText,
                nextReadingInstruction,
                nextIsActive,
                id
            ]
        );

        await client.query('COMMIT');
        transactionStarted = false;

        if (
            oldAudioPath &&
            (uploadedAudio || shouldRemoveAudio)
        ) {
            await removeBankAudioIfUnreferenced(oldAudioPath);
        }

        res.json({
            message: 'Paket berhasil diperbarui.',
            data: {
                ...result.rows[0],
                audio_url: formatBankAudioUrl(
                    result.rows[0].audio_file
                )
            }
        });
    } catch (error) {
        if (transactionStarted && client) {
            await client.query('ROLLBACK');
        }

        if (uploadedAudio?.objectPath) {
            await removeBankAudioIfUnreferenced(
                uploadedAudio.objectPath
            );
        }

        throw error;
    } finally {
        if (client) client.release();
    }
});
const deactivatePackage = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const result = await db.query(
        `UPDATE public.quiz_packages
         SET is_active = FALSE, updated_at = NOW()
         WHERE id = $1
         RETURNING id, name, is_active`,
        [id]
    );

    if (!result.rows.length) {
        return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    }

    res.json({
        message: 'Paket dinonaktifkan. Data soal tetap dipertahankan.',
        data: result.rows[0]
    });
});

// ==========================================
// BANK SOAL: PAKET DAN SOAL MANDIRI
// ==========================================

const getQuestions = asyncHandler(async (req, res) => {
    const { category, level, package_id, status, type } = req.query;

    if (category && !validCategory(category)) {
        return res.status(400).json({ message: 'Kategori tidak valid.' });
    }

    if (level && !validLevel(level)) {
        return res.status(400).json({ message: 'Level tidak valid.' });
    }

    const conditions = [];
    const values = [];

    if (category) {
        values.push(category);
        conditions.push(`s.category = $${values.length}`);
    }

    if (level) {
        values.push(level);
        conditions.push(
            `(q.level = $${values.length} OR
              (q.package_id IS NOT NULL AND p.level = $${values.length}))`
        );
    }

    if (package_id === 'standalone') {
        conditions.push('q.package_id IS NULL');
    } else if (package_id) {
        values.push(Number(package_id));
        conditions.push(`q.package_id = $${values.length}`);
    }

    if (type === 'package') {
        conditions.push('q.package_id IS NOT NULL');
    } else if (type === 'standalone') {
        conditions.push('q.package_id IS NULL');
    }

    if (status === 'active' || status === 'inactive') {
        values.push(status === 'active');
        conditions.push(`q.is_active = $${values.length}`);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await db.query(
        `SELECT
            q.id, q.package_id, q.subtopic_id, q.subtopic,
            q.question_text, q.options, q.correct_answer,
            q.explanation, q.level, q.is_active,
            q.audio_file, q.audio_duration_seconds,
            q.reading_text, q.reading_instruction,
            q.created_at, q.updated_at,
            s.category, s.name AS subtopic_name,
            p.name AS package_name, p.level AS package_level
         FROM public.quiz_questions q
         LEFT JOIN public.quiz_subtopics s ON s.id = q.subtopic_id
         LEFT JOIN public.quiz_packages p ON p.id = q.package_id
         ${where}
         ORDER BY q.created_at DESC`,
        values
    );

    res.json({ data: result.rows.map(formatQuestion) });
});

const createQuestion = asyncHandler(async (req, res) => {
    const validationError = validateQuestion(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const {
        package_id,
        subtopic_id,
        question_text,
        options,
        correct_answer,
        explanation,
        level,
        reading_text,
        reading_instruction
    } = req.body;

    let client;
    let uploadedAudio = null;
    let transactionStarted = false;

    try {
        client = await db.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        let category;
        let questionLevel = null;
        let packageId = null;

        if (
            package_id !== undefined &&
            package_id !== null &&
            package_id !== ''
        ) {
            packageId = Number(package_id);

            if (!Number.isInteger(packageId) || packageId <= 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'ID paket tidak valid.'
                });
            }

            const packageResult = await client.query(
                `SELECT category, level
                 FROM public.quiz_packages
                 WHERE id = $1
                 FOR UPDATE`,
                [packageId]
            );

            if (!packageResult.rows.length) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(404).json({
                    message: 'Paket tidak ditemukan.'
                });
            }

            category = packageResult.rows[0].category;
            questionLevel = null;
        } else {
            if (!validLevel(level)) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Level soal mandiri wajib valid.'
                });
            }

            questionLevel = level;

            const subtopicResult = await client.query(
                `SELECT category
                 FROM public.quiz_subtopics
                 WHERE id = $1 AND is_active = TRUE`,
                [subtopic_id]
            );

            if (!subtopicResult.rows.length) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Subtopik tidak ditemukan atau tidak aktif.'
                });
            }

            category = subtopicResult.rows[0].category;
        }

        const subtopicCheck = await checkSubtopic(
            client,
            subtopic_id,
            category
        );

        if (subtopicCheck.error) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                message: subtopicCheck.error
            });
        }

        if (req.file) {
            uploadedAudio = await uploadBankAudio(
                req.file,
                'questions'
            );
        }

        const result = await client.query(
            `INSERT INTO public.quiz_questions
                (package_id, subtopic_id, subtopic,
                 question_text, options, correct_answer,
                 explanation, level, is_active,
                 audio_file, audio_duration_seconds,
                 reading_text, reading_instruction)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE,
                     $9, $10, $11, $12)
             RETURNING *`,
            [
                packageId,
                subtopic_id,
                subtopicCheck.subtopic.name,
                String(question_text).trim(),
                JSON.stringify(parseOptions(options)),
                String(correct_answer).toUpperCase(),
                explanation || null,
                questionLevel,
                uploadedAudio?.objectPath || null,
                uploadedAudio?.duration || null,
                reading_text || null,
                reading_instruction || null
            ]
        );

        await client.query('COMMIT');
        transactionStarted = false;

        res.status(201).json({
            message: 'Soal berhasil ditambahkan.',
            data: formatQuestion(result.rows[0])
        });
    } catch (error) {
        if (transactionStarted && client) {
            await client.query('ROLLBACK');
        }

        if (uploadedAudio?.objectPath) {
            await removeBankAudioIfUnreferenced(
                uploadedAudio.objectPath
            );
        }

        throw error;
    } finally {
        if (client) client.release();
    }
});

const updateQuestion = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const validationError = validateQuestion(req.body);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'ID soal tidak valid.'
        });
    }

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const {
        subtopic_id,
        question_text,
        options,
        correct_answer,
        explanation,
        level,
        reading_text,
        reading_instruction,
        is_active,
        remove_audio
    } = req.body;

    const hasActiveUpdate =
        Object.prototype.hasOwnProperty.call(req.body, 'is_active');

    if (
        hasActiveUpdate &&
        ![true, false, 'true', 'false'].includes(is_active)
    ) {
        return res.status(400).json({
            message: 'Status soal tidak valid.'
        });
    }

    const shouldRemoveAudio =
        remove_audio === true || remove_audio === 'true';

    if (req.file && shouldRemoveAudio) {
        return res.status(400).json({
            message: 'Pilih unggah audio baru atau hapus audio, bukan keduanya.'
        });
    }

    let client;
    let uploadedAudio = null;
    let oldAudioPath = null;
    let transactionStarted = false;

    try {
        client = await db.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        const existing = await client.query(
            `SELECT
                q.package_id,
                q.is_active,
                q.audio_file,
                q.audio_duration_seconds,
                q.reading_text,
                q.reading_instruction,
                p.category AS package_category
             FROM public.quiz_questions q
             LEFT JOIN public.quiz_packages p
                ON p.id = q.package_id
             WHERE q.id = $1
             FOR UPDATE OF q`,
            [id]
        );

        if (!existing.rows.length) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(404).json({
                message: 'Soal tidak ditemukan.'
            });
        }

        const current = existing.rows[0];
        oldAudioPath = current.audio_file;

        let category = current.package_category;
        let questionLevel = null;

        if (!current.package_id) {
            if (!validLevel(level)) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Level soal mandiri wajib valid.'
                });
            }

            questionLevel = level;

            const subtopicResult = await client.query(
                `SELECT category
                 FROM public.quiz_subtopics
                 WHERE id = $1 AND is_active = TRUE`,
                [subtopic_id]
            );

            if (!subtopicResult.rows.length) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    message: 'Subtopik tidak ditemukan atau tidak aktif.'
                });
            }

            category = subtopicResult.rows[0].category;
        }

        const subtopicCheck = await checkSubtopic(
            client,
            subtopic_id,
            category
        );

        if (subtopicCheck.error) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                message: subtopicCheck.error
            });
        }

        if (req.file) {
            uploadedAudio = await uploadBankAudio(
                req.file,
                'questions'
            );
        }

        const nextAudioPath = uploadedAudio
            ? uploadedAudio.objectPath
            : shouldRemoveAudio
                ? null
                : current.audio_file;

        const nextAudioDuration = uploadedAudio
            ? uploadedAudio.duration
            : shouldRemoveAudio
                ? null
                : current.audio_duration_seconds;

        const nextReadingText =
            Object.prototype.hasOwnProperty.call(req.body, 'reading_text')
                ? (reading_text || null)
                : current.reading_text;

        const nextReadingInstruction =
            Object.prototype.hasOwnProperty.call(req.body, 'reading_instruction')
                ? (reading_instruction || null)
                : current.reading_instruction;

        const nextIsActive = hasActiveUpdate
            ? is_active === true || is_active === 'true'
            : current.is_active;

        const result = await client.query(
            `UPDATE public.quiz_questions
             SET subtopic_id = $1,
                 subtopic = $2,
                 question_text = $3,
                 options = $4,
                 correct_answer = $5,
                 explanation = $6,
                 level = $7,
                 audio_file = $8,
                 audio_duration_seconds = $9,
                 reading_text = $10,
                 reading_instruction = $11,
                 is_active = $12,
                 updated_at = NOW()
             WHERE id = $13
             RETURNING *`,
            [
                subtopic_id,
                subtopicCheck.subtopic.name,
                String(question_text).trim(),
                JSON.stringify(parseOptions(options)),
                String(correct_answer).toUpperCase(),
                explanation || null,
                questionLevel,
                nextAudioPath,
                nextAudioDuration,
                nextReadingText,
                nextReadingInstruction,
                nextIsActive,
                id
            ]
        );

        let parentDeactivated = false;

        if (current.package_id && !nextIsActive) {
            const parentResult = await client.query(
                `UPDATE public.quiz_packages
                 SET is_active = FALSE,
                     updated_at = NOW()
                 WHERE id = $1
                   AND is_active = TRUE
                 RETURNING id`,
                [current.package_id]
            );

            parentDeactivated = parentResult.rows.length > 0;
        }

        await client.query('COMMIT');
        transactionStarted = false;

        if (
            oldAudioPath &&
            (uploadedAudio || shouldRemoveAudio)
        ) {
            await removeBankAudioIfUnreferenced(oldAudioPath);
        }

        res.json({
            message: parentDeactivated
                ? 'Soal berhasil diperbarui dan paket induknya otomatis dinonaktifkan.'
                : 'Soal berhasil diperbarui.',
            data: {
                ...formatQuestion(result.rows[0]),
                parent_package_deactivated: parentDeactivated
            }
        });
    } catch (error) {
        if (transactionStarted && client) {
            await client.query('ROLLBACK');
        }

        if (uploadedAudio?.objectPath) {
            await removeBankAudioIfUnreferenced(
                uploadedAudio.objectPath
            );
        }

        throw error;
    } finally {
        if (client) client.release();
    }
});
const deactivateQuestion = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'ID soal tidak valid.'
        });
    }

    let client;
    let transactionStarted = false;

    try {
        client = await db.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        const result = await client.query(
            `UPDATE public.quiz_questions
             SET is_active = FALSE,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, package_id, question_text, is_active`,
            [id]
        );

        if (!result.rows.length) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(404).json({
                message: 'Soal tidak ditemukan.'
            });
        }

        const question = result.rows[0];
        let parentDeactivated = false;

        if (question.package_id) {
            const parentResult = await client.query(
                `UPDATE public.quiz_packages
                 SET is_active = FALSE,
                     updated_at = NOW()
                 WHERE id = $1
                   AND is_active = TRUE
                 RETURNING id`,
                [question.package_id]
            );

            parentDeactivated = parentResult.rows.length > 0;
        }

        await client.query('COMMIT');
        transactionStarted = false;

        res.json({
            message: parentDeactivated
                ? 'Soal berhasil dinonaktifkan dan paket induknya otomatis dinonaktifkan.'
                : 'Soal berhasil dinonaktifkan.',
            data: {
                ...question,
                parent_package_deactivated: parentDeactivated
            }
        });
    } catch (error) {
        if (transactionStarted && client) {
            await client.query('ROLLBACK');
        }

        throw error;
    } finally {
        if (client) client.release();
    }
});
module.exports = {
    getPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deactivatePackage,
    getQuestions,
    createQuestion,
    updateQuestion,
    deactivateQuestion
};








