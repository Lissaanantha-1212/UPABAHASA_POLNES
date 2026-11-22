const db = require('../config/db.pg');
const crypto = require('crypto');
const storageService = require('../services/storageService');

const CATEGORIES = ['listening', 'reading', 'structure'];
const BANK_AUDIO_BUCKET = 'quiz-audio';

const AUDIO_EXTENSIONS = {
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a'
};


const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const validCategory = (value) => CATEGORIES.includes(value);

const parseJson = (value, fallback = null) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== 'string') return value;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const parseOptions = (value) => {
    const options = parseJson(value, []);
    return Array.isArray(options) ? options : [];
};

const normalizeAnswers = (value) => {
    let answers = parseJson(value, value);

    if (!Array.isArray(answers)) {
        answers = String(answers || '')
            .toUpperCase()
            .split(/[;,]/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [...new Set(
        answers.map(item => String(item).trim().toUpperCase())
    )].sort();
};

const validateQuestion = (data) => {
    if (!data || typeof data !== 'object') {
        return 'Data soal tidak valid.';
    }

    if (!String(data.question_text || '').trim()) {
        return 'Teks pertanyaan wajib diisi.';
    }

    if (!String(data.subtopic || '').trim()) {
        return 'Subtopik wajib diisi.';
    }

    if (!String(data.explanation || '').trim()) {
        return 'Pembahasan wajib diisi.';
    }

    if (!String(data.recommendation_material || '').trim()) {
        return 'Rekomendasi materi wajib diisi.';
    }

    const options = parseOptions(data.options);

    if (options.length < 3 || options.length > 4) {
        return 'Pilihan jawaban harus berjumlah 3 sampai 4.';
    }

    const expected = ['A', 'B', 'C', 'D'].slice(0, options.length);
    const labels = options.map(item =>
        String(item?.label || '').trim().toUpperCase()
    );

    if (
        labels.some((label, index) => label !== expected[index]) ||
        options.some(item => !String(item?.text || '').trim())
    ) {
        return 'Pilihan jawaban harus berurutan A sampai D dan tidak boleh kosong.';
    }

    const answers = normalizeAnswers(data.correct_answer);

    if (answers.length !== 1) {
        return 'Setiap soal hanya boleh memiliki satu kunci jawaban.';
    }

    if (!expected.includes(answers[0])) {
        return 'Kunci jawaban harus sesuai dengan pilihan yang tersedia.';
    }

    return null;
};

const formatAudioUrl = (objectPath) => {
    if (
        typeof objectPath !== 'string' ||
        !/^(?:listening\/[0-9a-f-]+\.(?:mp3|wav|m4a)|bank\/(?:packages|questions)\/[0-9a-f-]+\.(?:mp3|wav|m4a))$/i.test(objectPath)
    ) {
        return null;
    }

    return storageService.getPublicUrl(BANK_AUDIO_BUCKET, objectPath);
};

const formatQuestion = (row) => ({
    ...row,
    options: parseOptions(row.options),
    correct_answer: normalizeAnswers(row.correct_answer),
    audio_url: formatAudioUrl(row.audio_file)
});

const formatPackage = (row) => ({
    ...row,
    audio_url: formatAudioUrl(row.audio_file)
});

const getListeningAudio = asyncHandler(async (req, res) => {
    const files = await storageService.listObjects(
        BANK_AUDIO_BUCKET,
        'listening',
        {
            limit: 1000,
            offset: 0
        }
    );

    const audioFiles = files
        .filter((file) => {
            if (!file || !file.name || !file.id) return false;

            return /\.(mp3|wav|m4a)$/i.test(file.name);
        })
        .map((file) => {
            const objectPath = `listening/${file.name}`;

            return {
                name: file.name,
                object_path: objectPath,
                audio_url: storageService.getPublicUrl(
                    BANK_AUDIO_BUCKET,
                    objectPath
                ),
                created_at: file.created_at || null,
                updated_at: file.updated_at || null,
                metadata: file.metadata || null
            };
        });

    return res.json({
        success: true,
        total: audioFiles.length,
        data: audioFiles
    });
});

const getBankItems = asyncHandler(async (req, res) => {
    const { category, status, type } = req.query;

    if (category && !validCategory(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori tidak valid.'
        });
    }

    if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Filter status tidak valid.'
        });
    }

    if (type && !['package', 'standalone'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Tipe item bank tidak valid.'
        });
    }

    const values = [];
    const conditions = [];

    if (category) {
        values.push(category);
        conditions.push(`category = $${values.length}`);
    }

    if (status) {
        values.push(status === 'active');
        conditions.push(`is_active = $${values.length}`);
    }

    const where = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const packageResult = type === 'standalone'
        ? { rows: [] }
        : await db.query(
            `SELECT
                'package' AS type,
                p.id,
                p.category,
                p.name,
                p.is_active,
                p.created_at,
                p.updated_at,
                p.audio_file,
                p.audio_duration_seconds,
                p.reading_text,
                p.reading_instruction,
                p.stimulus_note,
                COUNT(q.id)::INTEGER AS question_count
             FROM public.quiz_packages p
             LEFT JOIN public.quiz_questions q
                ON q.package_id = p.id
             ${where.replace(/\bcategory\b/g, 'p.category')
                 .replace(/\bis_active\b/g, 'p.is_active')}
             GROUP BY p.id
             ORDER BY p.created_at DESC, p.id DESC`,
            values
        );

    const standaloneResult = type === 'package'
        ? { rows: [] }
        : await db.query(
            `SELECT
                'standalone' AS type,
                q.id,
                q.category,
                'Soal Mandiri' AS name,
                q.is_active,
                q.created_at,
                q.updated_at,
                q.audio_file,
                q.audio_duration_seconds,
                q.reading_text,
                q.reading_instruction,
                1::INTEGER AS question_count
             FROM public.quiz_questions q
             ${where.replace(/\bcategory\b/g, 'q.category')
                 .replace(/\bis_active\b/g, 'q.is_active')}
             ${where ? 'AND' : 'WHERE'} q.package_id IS NULL
             ORDER BY q.created_at DESC, q.id DESC`,
            values
        );

    const items = [
        ...packageResult.rows,
        ...standaloneResult.rows
    ]
        .sort((a, b) => {
            const dateDifference =
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime();

            return dateDifference || Number(b.id) - Number(a.id);
        })
        .map((item, index) => ({
            ...item,
            bank_number: index + 1,
            audio_url: formatAudioUrl(item.audio_file)
        }));

    return res.json({
        success: true,
        total: items.length,
        data: items
    });
});

const getPackageById = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID paket tidak valid.'
        });
    }

    const packageResult = await db.query(
        `SELECT *
         FROM public.quiz_packages
         WHERE id = $1
         LIMIT 1`,
        [id]
    );

    if (!packageResult.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Paket tidak ditemukan.'
        });
    }

    const questionResult = await db.query(
        `SELECT *
         FROM public.quiz_questions
         WHERE package_id = $1
         ORDER BY id ASC`,
        [id]
    );

    return res.json({
        success: true,
        data: {
            ...formatPackage(packageResult.rows[0]),
            questions: questionResult.rows.map(formatQuestion)
        }
    });
});

const getQuestionById = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID soal tidak valid.'
        });
    }

    const result = await db.query(
        `SELECT *
         FROM public.quiz_questions
         WHERE id = $1
           AND package_id IS NULL
         LIMIT 1`,
        [id]
    );

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Soal mandiri tidak ditemukan.'
        });
    }

    return res.json({
        success: true,
        data: formatQuestion(result.rows[0])
    });
});


const getBankAudioDuration = async (file) => {
    if (
        !file ||
        !Buffer.isBuffer(file.buffer) ||
        !AUDIO_EXTENSIONS[file.mimetype]
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
    const extension = AUDIO_EXTENSIONS[file.mimetype];
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
        console.error(
            'Gagal membersihkan audio bank Kuis:',
            error.message
        );
        return false;
    }
};
const validateLegacyListeningAudioPath = async (objectPath) => {
    if (
        typeof objectPath !== 'string' ||
        !/^listening\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|wav|m4a)$/i.test(objectPath)
    ) {
        return false;
    }

    const files = await storageService.listObjects(
        BANK_AUDIO_BUCKET,
        'listening',
        {
            limit: 1000,
            offset: 0
        }
    );

    const fileName = objectPath.slice('listening/'.length);

    return files.some(file =>
        file &&
        file.id &&
        file.name === fileName &&
        /\.(mp3|wav|m4a)$/i.test(file.name)
    );
};
const createPackage = asyncHandler(async (req, res) => {
    const category = String(req.body.category || '').trim();
    const stimulusNote = String(req.body.stimulus_note || '').trim();
    const readingText = String(req.body.reading_text || '').trim();
    const readingInstruction = String(req.body.reading_instruction || '').trim();
    const selectedAudioPath = String(req.body.audio_path || '').trim();

    if (!validCategory(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori Kuis tidak valid.'
        });
    }

    if (!stimulusNote) {
        return res.status(400).json({
            success: false,
            message: 'Catatan stimulus wajib diisi.'
        });
    }

    if (req.file && selectedAudioPath) {
        return res.status(400).json({
            success: false,
            message: 'Pilih audio lama atau unggah audio baru, bukan keduanya.'
        });
    }

    if (selectedAudioPath && category !== 'listening') {
        return res.status(400).json({
            success: false,
            message: 'Pemilihan audio hanya tersedia untuk kategori Listening.'
        });
    }

    if (selectedAudioPath) {
        const isValidAudio = await validateLegacyListeningAudioPath(
            selectedAudioPath
        );

        if (!isValidAudio) {
            return res.status(400).json({
                success: false,
                message: 'Audio Listening yang dipilih tidak ditemukan atau tidak valid.'
            });
        }
    }

    if (
        category === 'listening' &&
        !req.file &&
        !selectedAudioPath
    ) {
        return res.status(400).json({
            success: false,
            message: 'Pilih audio Listening yang tersedia atau unggah audio baru.'
        });
    }

    if (category === 'reading' && !readingText) {
        return res.status(400).json({
            success: false,
            message: 'Teks stimulus untuk kategori Reading wajib diisi.'
        });
    }

    const questions = parseJson(req.body.questions, null);

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Pertanyaan paket wajib diisi.'
        });
    }

    for (let index = 0; index < questions.length; index++) {
        const validationError = validateQuestion(questions[index]);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: `Pertanyaan nomor ${index + 1}: ${validationError}`
            });
        }
    }

    let uploadedAudioPath = null;
    let client;

    try {
        let audioDuration = null;

        if (req.file) {
            const uploaded = await uploadBankAudio(req.file, 'packages');
            uploadedAudioPath = uploaded.objectPath;
            audioDuration = uploaded.duration;
        }

        const packageAudioPath =
            uploadedAudioPath || selectedAudioPath || null;

        client = await db.connect();
        await client.query('BEGIN');

        const categoryLabels = {
            listening: 'Listening',
            reading: 'Reading',
            structure: 'Grammar'
        };

        const packageName = String(req.body.name || '').trim() ||
            `Paket ${categoryLabels[category]} ${Date.now()}`;

        const packageResult = await client.query(
            `INSERT INTO public.quiz_packages (
                category,
                name,
                audio_file,
                audio_duration_seconds,
                reading_text,
                reading_instruction,
                stimulus_note,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
            RETURNING *`,
            [
                category,
                packageName,
                packageAudioPath,
                audioDuration,
                readingText || null,
                readingInstruction || null,
                stimulusNote
            ]
        );

        const savedQuestions = [];

        for (const question of questions) {
            const questionResult = await client.query(
                `INSERT INTO public.quiz_questions (
                    package_id,
                    category,
                    subtopic,
                    question_text,
                    options,
                    correct_answer,
                    explanation,
                    recommendation_material,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                RETURNING *`,
                [
                    packageResult.rows[0].id,
                    category,
                    String(question.subtopic).trim(),
                    String(question.question_text).trim(),
                    JSON.stringify(parseOptions(question.options)),
                    JSON.stringify(normalizeAnswers(question.correct_answer)),
                    String(question.explanation).trim(),
                    String(question.recommendation_material).trim()
                ]
            );

            savedQuestions.push(questionResult.rows[0]);
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Paket soal berhasil ditambahkan dan disimpan dalam keadaan nonaktif.',
            data: {
                ...formatPackage(packageResult.rows[0]),
                questions: savedQuestions.map(formatQuestion)
            }
        });
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Rollback paket Kuis gagal:', rollbackError.message);
            }
        }

        if (uploadedAudioPath) {
            await removeBankAudioIfUnreferenced(uploadedAudioPath);
        }

        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
});
const updatePackage = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID paket tidak valid.'
        });
    }

    const category = String(req.body.category || '').trim();
    const stimulusNote = String(req.body.stimulus_note || '').trim();
    const readingText = String(req.body.reading_text || '').trim();
    const readingInstruction = String(req.body.reading_instruction || '').trim();
    const selectedAudioPath = String(req.body.audio_path || '').trim();
    const questions = parseJson(req.body.questions, null);

    if (!validCategory(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori Kuis tidak valid.'
        });
    }

    if (!stimulusNote) {
        return res.status(400).json({
            success: false,
            message: 'Catatan stimulus wajib diisi.'
        });
    }

    if (req.file && selectedAudioPath) {
        return res.status(400).json({
            success: false,
            message: 'Pilih audio lama atau unggah audio baru, bukan keduanya.'
        });
    }

    if (selectedAudioPath && category !== 'listening') {
        return res.status(400).json({
            success: false,
            message: 'Pemilihan audio hanya tersedia untuk kategori Listening.'
        });
    }

    if (selectedAudioPath) {
        const isValidAudio = await validateLegacyListeningAudioPath(
            selectedAudioPath
        );

        if (!isValidAudio) {
            return res.status(400).json({
                success: false,
                message: 'Audio Listening yang dipilih tidak ditemukan atau tidak valid.'
            });
        }
    }

    if (category === 'reading' && !readingText) {
        return res.status(400).json({
            success: false,
            message: 'Teks stimulus kategori Reading wajib diisi.'
        });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Pertanyaan paket wajib diisi.'
        });
    }

    for (let index = 0; index < questions.length; index++) {
        const validationError = validateQuestion(questions[index]);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: `Pertanyaan nomor ${index + 1}: ${validationError}`
            });
        }
    }

    let client;
    let uploadedAudioPath = null;
    let oldAudioPath = null;

    try {
        client = await db.connect();
        await client.query('BEGIN');

        const existingResult = await client.query(
            `SELECT *
             FROM public.quiz_packages
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (!existingResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Paket tidak ditemukan.'
            });
        }

        const existing = existingResult.rows[0];

        if (existing.is_active) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Nonaktifkan paket terlebih dahulu sebelum mengedit.'
            });
        }

        if (
            category === 'listening' &&
            !req.file &&
            !selectedAudioPath &&
            !existing.audio_file
        ) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Pilih audio Listening yang tersedia atau unggah audio baru.'
            });
        }

        let uploadedAudioDuration = null;

        if (req.file) {
            const uploaded = await uploadBankAudio(req.file, 'packages');
            uploadedAudioPath = uploaded.objectPath;
            uploadedAudioDuration = uploaded.duration;
        }

        oldAudioPath = existing.audio_file;

        const audioPath =
            uploadedAudioPath ||
            selectedAudioPath ||
            existing.audio_file ||
            null;

        let audioDuration = existing.audio_duration_seconds;

        if (uploadedAudioDuration !== null) {
            audioDuration = uploadedAudioDuration;
        } else if (selectedAudioPath) {
            audioDuration = null;
        }

        const packageName = String(req.body.name || '').trim() ||
            existing.name;

        const packageResult = await client.query(
            `UPDATE public.quiz_packages
             SET category = $1,
                 name = $2,
                 audio_file = $3,
                 audio_duration_seconds = $4,
                 reading_text = $5,
                 reading_instruction = $6,
                 stimulus_note = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [
                category,
                packageName,
                audioPath,
                audioDuration,
                readingText || null,
                readingInstruction || null,
                stimulusNote,
                id
            ]
        );

        await client.query(
            `DELETE FROM public.quiz_questions
             WHERE package_id = $1`,
            [id]
        );

        const savedQuestions = [];

        for (const question of questions) {
            const questionResult = await client.query(
                `INSERT INTO public.quiz_questions (
                    package_id,
                    category,
                    subtopic,
                    question_text,
                    options,
                    correct_answer,
                    explanation,
                    recommendation_material,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
                RETURNING *`,
                [
                    id,
                    category,
                    String(question.subtopic).trim(),
                    String(question.question_text).trim(),
                    JSON.stringify(parseOptions(question.options)),
                    JSON.stringify(normalizeAnswers(question.correct_answer)),
                    String(question.explanation).trim(),
                    String(question.recommendation_material).trim()
                ]
            );

            savedQuestions.push(questionResult.rows[0]);
        }

        await client.query('COMMIT');

        if (oldAudioPath && oldAudioPath !== audioPath) {
            await removeBankAudioIfUnreferenced(oldAudioPath);
        }

        return res.json({
            success: true,
            message: 'Paket soal berhasil diperbarui.',
            data: {
                ...formatPackage(packageResult.rows[0]),
                questions: savedQuestions.map(formatQuestion)
            }
        });
    } catch (error) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Rollback edit paket gagal:', rollbackError.message);
            }
        }

        if (uploadedAudioPath) {
            await removeBankAudioIfUnreferenced(uploadedAudioPath);
        }

        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
});
const updatePackageStatus = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const isActive = req.body.is_active;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID paket tidak valid.'
        });
    }

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'Status paket harus berupa boolean.'
        });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const packageResult = await client.query(
            `SELECT id, is_active
             FROM public.quiz_packages
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (!packageResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Paket tidak ditemukan.'
            });
        }

        if (isActive) {
            const questionCheck = await client.query(
                `SELECT
                    COUNT(*)::INTEGER AS total,
                    COUNT(*) FILTER (WHERE is_active = FALSE)::INTEGER AS inactive
                 FROM public.quiz_questions
                 WHERE package_id = $1`,
                [id]
            );

            const { total, inactive } = questionCheck.rows[0];

            if (total === 0 || inactive > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    success: false,
                    message: 'Paket harus memiliki pertanyaan dan seluruh pertanyaannya harus aktif.'
                });
            }
        }

        const result = await client.query(
            `UPDATE public.quiz_packages
             SET is_active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [isActive, id]
        );

        await client.query('COMMIT');

        return res.json({
            success: true,
            message: isActive
                ? 'Paket berhasil diaktifkan.'
                : 'Paket berhasil dinonaktifkan.',
            data: formatPackage(result.rows[0])
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback status paket gagal:', rollbackError.message);
        }
        throw error;
    } finally {
        client.release();
    }
});

const deletePackage = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID paket tidak valid.'
        });
    }

    const client = await db.connect();
    let audioPath = null;

    try {
        await client.query('BEGIN');

        const packageResult = await client.query(
            `SELECT id, name, is_active, audio_file
             FROM public.quiz_packages
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (!packageResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Paket tidak ditemukan.'
            });
        }

        const existing = packageResult.rows[0];

        if (existing.is_active) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Nonaktifkan paket terlebih dahulu sebelum menghapus.'
            });
        }

        audioPath = existing.audio_file;

        await client.query(
            `DELETE FROM public.quiz_packages WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');

        if (audioPath) {
            await removeBankAudioIfUnreferenced(audioPath);
        }

        return res.json({
            success: true,
            message: 'Paket dan seluruh pertanyaannya berhasil dihapus.'
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback hapus paket gagal:', rollbackError.message);
        }
        throw error;
    } finally {
        client.release();
    }
});
const createQuestion = asyncHandler(async (req, res) => {
    const category = String(req.body.category || '').trim();

    if (!validCategory(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori Kuis tidak valid.'
        });
    }

    const validationError = validateQuestion(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    if (category === 'listening' && !req.file) {
        return res.status(400).json({
            success: false,
            message: 'File audio wajib diunggah untuk soal Listening.'
        });
    }

    if (category !== 'listening' && req.file) {
        return res.status(400).json({
            success: false,
            message: 'Audio hanya diperbolehkan untuk soal Listening.'
        });
    }

    let uploadedAudioPath = null;

    try {
        let audioDuration = null;

        if (req.file) {
            const uploaded = await uploadBankAudio(req.file, 'questions');
            uploadedAudioPath = uploaded.objectPath;
            audioDuration = uploaded.duration;
        }

        const result = await db.query(
            `INSERT INTO public.quiz_questions (
                package_id, category, subtopic, question_text,
                options, correct_answer, explanation,
                recommendation_material, audio_file,
                audio_duration_seconds, is_active
            )
            VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
            RETURNING *`,
            [
                category,
                String(req.body.subtopic).trim(),
                String(req.body.question_text).trim(),
                JSON.stringify(parseOptions(req.body.options)),
                JSON.stringify(normalizeAnswers(req.body.correct_answer)),
                String(req.body.explanation).trim(),
                String(req.body.recommendation_material).trim(),
                uploadedAudioPath,
                audioDuration
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Soal mandiri berhasil ditambahkan dalam status nonaktif.',
            data: formatQuestion(result.rows[0])
        });
    } catch (error) {
        if (uploadedAudioPath) {
            await removeBankAudioIfUnreferenced(uploadedAudioPath);
        }

        throw error;
    }
});

const updateQuestion = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const category = String(req.body.category || '').trim();

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID soal tidak valid.'
        });
    }

    if (!validCategory(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori Kuis tidak valid.'
        });
    }

    const validationError = validateQuestion(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError
        });
    }

    if (category !== 'listening' && req.file) {
        return res.status(400).json({
            success: false,
            message: 'Audio hanya diperbolehkan untuk soal Listening.'
        });
    }

    const client = await db.connect();

    let uploadedAudioPath = null;
    let oldAudioPath = null;

    try {
        await client.query('BEGIN');

        const existingResult = await client.query(
            `SELECT id, is_active, audio_file, audio_duration_seconds
             FROM public.quiz_questions
             WHERE id = $1
               AND package_id IS NULL
             FOR UPDATE`,
            [id]
        );

        if (!existingResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Soal mandiri tidak ditemukan.'
            });
        }

        const existing = existingResult.rows[0];

        if (existing.is_active) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Nonaktifkan soal terlebih dahulu sebelum mengedit.'
            });
        }

        oldAudioPath = existing.audio_file;

        let audioPath = null;
        let audioDuration = null;

        if (category === 'listening') {
            if (req.file) {
                const uploaded = await uploadBankAudio(req.file, 'questions');
                uploadedAudioPath = uploaded.objectPath;
                audioPath = uploaded.objectPath;
                audioDuration = uploaded.duration;
            } else {
                if (!existing.audio_file) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: 'Unggah file audio Listening terlebih dahulu.'
                    });
                }

                audioPath = existing.audio_file;
                audioDuration = existing.audio_duration_seconds;
            }
        }

        const result = await client.query(
            `UPDATE public.quiz_questions
             SET category = $1,
                 subtopic = $2,
                 question_text = $3,
                 options = $4,
                 correct_answer = $5,
                 explanation = $6,
                 recommendation_material = $7,
                 audio_file = $8,
                 audio_duration_seconds = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10
               AND package_id IS NULL
             RETURNING *`,
            [
                category,
                String(req.body.subtopic).trim(),
                String(req.body.question_text).trim(),
                JSON.stringify(parseOptions(req.body.options)),
                JSON.stringify(normalizeAnswers(req.body.correct_answer)),
                String(req.body.explanation).trim(),
                String(req.body.recommendation_material).trim(),
                audioPath,
                audioDuration,
                id
            ]
        );

        await client.query('COMMIT');

        if (oldAudioPath && oldAudioPath !== audioPath) {
            await removeBankAudioIfUnreferenced(oldAudioPath);
        }

        return res.json({
            success: true,
            message: 'Soal mandiri berhasil diperbarui.',
            data: formatQuestion(result.rows[0])
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback edit soal gagal:', rollbackError.message);
        }

        if (uploadedAudioPath) {
            await removeBankAudioIfUnreferenced(uploadedAudioPath);
        }

        throw error;
    } finally {
        client.release();
    }
});

const updateQuestionStatus = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { is_active } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID soal tidak valid.'
        });
    }

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'Status soal harus berupa boolean.'
        });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const existing = await client.query(
            `SELECT id, is_active
             FROM public.quiz_questions
             WHERE id = $1
               AND package_id IS NULL
             FOR UPDATE`,
            [id]
        );

        if (!existing.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Soal mandiri tidak ditemukan.'
            });
        }

        const result = await client.query(
            `UPDATE public.quiz_questions
             SET is_active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
               AND package_id IS NULL
             RETURNING *`,
            [is_active, id]
        );

        await client.query('COMMIT');

        return res.json({
            success: true,
            message: is_active
                ? 'Soal mandiri berhasil diaktifkan.'
                : 'Soal mandiri berhasil dinonaktifkan.',
            data: formatQuestion(result.rows[0])
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback status soal gagal:', rollbackError.message);
        }
        throw error;
    } finally {
        client.release();
    }
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID soal tidak valid.'
        });
    }

    const client = await db.connect();
    let audioPath = null;

    try {
        await client.query('BEGIN');

        const existing = await client.query(
            `SELECT id, is_active, audio_file
             FROM public.quiz_questions
             WHERE id = $1
               AND package_id IS NULL
             FOR UPDATE`,
            [id]
        );

        if (!existing.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Soal mandiri tidak ditemukan.'
            });
        }

        if (existing.rows[0].is_active) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                message: 'Nonaktifkan soal terlebih dahulu sebelum menghapus.'
            });
        }

        audioPath = existing.rows[0].audio_file;

        await client.query(
            `DELETE FROM public.quiz_questions
             WHERE id = $1
               AND package_id IS NULL`,
            [id]
        );

        await client.query('COMMIT');

        if (audioPath) {
            await removeBankAudioIfUnreferenced(audioPath);
        }

        return res.json({
            success: true,
            message: 'Soal mandiri berhasil dihapus.'
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback hapus soal gagal:', rollbackError.message);
        }

        throw error;
    } finally {
        client.release();
    }
});

module.exports = {
    getListeningAudio,
    getBankItems,
    getPackageById,
    getQuestionById,
    createPackage,
    updatePackage,
    updatePackageStatus,
    deletePackage,
    createQuestion,
    updateQuestion,
    updateQuestionStatus,
    deleteQuestion
};













