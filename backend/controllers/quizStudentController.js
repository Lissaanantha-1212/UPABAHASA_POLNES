const db = require('../config/db.pg');
const crypto = require('crypto');
const storageService = require('../services/storageService');
const { selectQuizItems } = require('../utils/quizBankSelector');

const CATEGORIES = ['reading', 'structure'];
const LEVELS = ['singkat', 'sedang', 'panjang'];
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const LEVEL_RANGES = {
    singkat: { min: 5, max: 10 },
    sedang: { min: 11, max: 20 },
    panjang: { min: 21, max: 30 }
};

const getEncryptionKey = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET belum dikonfigurasi.');
    }

    return crypto.createHash('sha256').update(secret).digest();
};

const encryptSnapshot = (snapshot) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        getEncryptionKey(),
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(snapshot), 'utf8'),
        cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return [
        iv.toString('base64url'),
        tag.toString('base64url'),
        encrypted.toString('base64url')
    ].join('.');
};

const decryptSnapshot = (token) => {
    const parts = String(token || '').split('.');

    if (parts.length !== 3) {
        throw new Error('Token sesi kuis tidak valid.');
    }

    const [ivPart, tagPart, encryptedPart] = parts;

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        getEncryptionKey(),
        Buffer.from(ivPart, 'base64url')
    );

    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedPart, 'base64url')),
        decipher.final()
    ]);

    const snapshot = JSON.parse(decrypted.toString('utf8'));

    if (!Number.isFinite(snapshot.expires_at) || Date.now() > snapshot.expires_at) {
        const error = new Error('Sesi kuis telah kedaluwarsa. Silakan mulai kembali.');
        error.code = 'QUIZ_SESSION_EXPIRED';
        throw error;
    }

    if (!Array.isArray(snapshot.questions)) {
        throw new Error('Isi snapshot kuis tidak valid.');
    }

    return snapshot;
};

const parseOptions = (value) => {
    if (Array.isArray(value)) return value;

    if (typeof value !== 'string') return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const normalizeAnswerSet = (value) => {
    if (Array.isArray(value)) {
        return [...new Set(
            value.map((item) => String(item).trim().toUpperCase())
        )].sort();
    }

    const raw = String(value || '').trim().toUpperCase();

    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
            return normalizeAnswerSet(parsed);
        }
    } catch {
        // Jawaban tunggal atau format huruf dipisahkan koma.
    }

    const values = /^[A-D]{2,4}$/.test(raw)
        ? raw.split('')
        : raw.split(/[;,]/);

    return [...new Set(
        values.map((item) => item.trim()).filter(Boolean)
    )].sort();
};

const formatAudioUrl = (objectPath) => {
    if (
        typeof objectPath !== 'string' ||
        !/^(?:listening\/[0-9a-f-]+\.(?:mp3|wav|m4a)|bank\/(?:packages|questions)\/[0-9a-f-]+\.(?:mp3|wav|m4a))$/i.test(objectPath)
    ) {
        return null;
    }

    return storageService.getPublicUrl('quiz-audio', objectPath);
};

const formatQuestion = (row) => ({
    id: Number(row.id ?? row.question_id),
    subtopic: row.subtopic,
    question_text: row.question_text,
    options: parseOptions(row.options),
    correct_answer: normalizeAnswerSet(row.correct_answer),
    explanation: row.explanation,
    recommendation_material: row.recommendation_material,
    audio_url: formatAudioUrl(row.audio_file),
    audio_duration_seconds: row.audio_duration_seconds,
    reading_text: row.reading_text,
    reading_instruction: row.reading_instruction
});

const toPublicItem = (item) => {
    const publicItem = { ...item };

    // Catatan stimulus hanya untuk kebutuhan pengelolaan admin.
    delete publicItem.stimulus_note;

    return {
        ...publicItem,
        questions: item.questions.map((question) => {
            const {
                correct_answer,
                explanation,
                recommendation_material,
                ...publicQuestion
            } = question;

            return publicQuestion;
        })
    };
};

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

exports.startQuiz = asyncHandler(async (req, res) => {
    const category = String(req.body?.category || '').toLowerCase();
    const level = String(req.body?.level || '').toLowerCase();

    if (category === 'listening') {
        return res.status(503).json({
            success: false,
            code: 'QUIZ_CATEGORY_UNDER_MAINTENANCE',
            message: 'Latihan Listening sedang dalam pemeliharaan.'
        });
    }

    if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori Kuis tidak valid.'
        });
    }

    if (!LEVELS.includes(level)) {
        return res.status(400).json({
            success: false,
            message: 'Panjang latihan tidak valid.'
        });
    }

    // Pengaturan jumlah paket dan soal sepenuhnya dibaca dari database.
    const settingsResult = await db.query(
        `SELECT
            packages_to_take,
            questions_to_take,
            min_questions,
            max_questions
         FROM public.quiz_settings
         WHERE category = $1 AND level = $2
         LIMIT 1`,
        [category, level]
    );

    const settings = settingsResult.rows[0];

    if (!settings) {
        return res.status(404).json({
            success: false,
            message: 'Pengaturan Kuis untuk pilihan tersebut belum tersedia.'
        });
    }

    const minQuestions = Number(settings.min_questions);
    const maxQuestions = Number(settings.max_questions);

    if (
        !Number.isInteger(minQuestions) ||
        !Number.isInteger(maxQuestions) ||
        minQuestions < 1 ||
        maxQuestions < minQuestions
    ) {
        return res.status(500).json({
            success: false,
            message: 'Rentang jumlah soal pada pengaturan Kuis tidak valid.'
        });
    }

    let itemsToTake;

    if (category === 'reading') {
        itemsToTake = Number(settings.packages_to_take);

        if (
            !Number.isInteger(itemsToTake) ||
            itemsToTake < 1 ||
            settings.questions_to_take !== null
        ) {
            return res.status(500).json({
                success: false,
                message: 'Pengaturan jumlah paket Reading tidak valid.'
            });
        }
    }

    if (category === 'structure') {
        itemsToTake = Number(settings.questions_to_take);

        if (
            !Number.isInteger(itemsToTake) ||
            itemsToTake < 1 ||
            settings.packages_to_take !== null
        ) {
            return res.status(500).json({
                success: false,
                message: 'Pengaturan jumlah soal Grammar tidak valid.'
            });
        }
    }

    const bankItems = [];

    if (category === 'structure') {
        // Grammar hanya mengambil soal mandiri.
        const standaloneResult = await db.query(
            `SELECT
                id,
                subtopic,
                question_text,
                options,
                correct_answer,
                explanation,
                recommendation_material,
                audio_file,
                audio_duration_seconds,
                reading_text,
                reading_instruction
             FROM public.quiz_questions
             WHERE category = $1
               AND package_id IS NULL
               AND is_active = TRUE
             ORDER BY id`,
            [category]
        );

        for (const row of standaloneResult.rows) {
            bankItems.push({
                id: `question-${row.id}`,
                source_id: Number(row.id),
                type: 'standalone',
                name: 'Soal Mandiri',
                questions: [formatQuestion(row)]
            });
        }
    }

    if (category === 'reading') {
        // Reading hanya mengambil paket aktif.
        // Paket yang memiliki soal tidak aktif dikeluarkan seluruhnya.
        const packageResult = await db.query(
            `SELECT
                p.id AS package_id,
                p.category,
                p.name AS package_name,
                p.audio_file AS package_audio_file,
                p.audio_duration_seconds AS package_audio_duration_seconds,
                p.reading_text AS package_reading_text,
                p.reading_instruction AS package_reading_instruction,
                p.stimulus_note,
                q.id AS question_id,
                q.subtopic,
                q.question_text,
                q.options,
                q.correct_answer,
                q.explanation,
                q.recommendation_material,
                q.audio_file,
                q.audio_duration_seconds,
                q.reading_text,
                q.reading_instruction
             FROM public.quiz_packages p
             JOIN public.quiz_questions q
               ON q.package_id = p.id
             WHERE p.category = $1
               AND p.is_active = TRUE
               AND NOT EXISTS (
                   SELECT 1
                   FROM public.quiz_questions inactive_q
                   WHERE inactive_q.package_id = p.id
                     AND inactive_q.is_active = FALSE
               )
             ORDER BY p.id, q.id`,
            [category]
        );

        const packages = new Map();

        for (const row of packageResult.rows) {
            if (!packages.has(row.package_id)) {
                packages.set(row.package_id, {
                    id: `package-${row.package_id}`,
                    source_id: Number(row.package_id),
                    type: 'package',
                    name: row.package_name,
                    stimulus_note: row.stimulus_note,
                    audio_url: formatAudioUrl(row.package_audio_file),
                    audio_duration_seconds: row.package_audio_duration_seconds,
                    reading_text: row.package_reading_text,
                    reading_instruction: row.package_reading_instruction,
                    questions: []
                });
            }

            packages.get(row.package_id).questions.push(
                formatQuestion(row)
            );
        }

        bankItems.push(...packages.values());
    }

    let selection;

    try {
        selection = selectQuizItems({
            items: bankItems,
            minQuestions,
            maxQuestions,
            itemsToTake
        });
    } catch (error) {
        if (error.code === 'INSUFFICIENT_QUIZ_BANK') {
            return res.status(409).json({
                success: false,
                code: error.code,
                message: category === 'reading'
                    ? 'Bank paket Reading belum mencukupi untuk tingkat latihan yang dipilih.'
                    : 'Bank soal Grammar belum mencukupi untuk tingkat latihan yang dipilih.'
            });
        }

        throw error;
    }

    const expiresAt = Date.now() + SESSION_TTL_MS;

    const snapshot = {
        category,
        level,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        total_questions: selection.totalQuestions,
        questions: selection.questions
    };

    const sessionToken = encryptSnapshot(snapshot);

    return res.status(200).json({
        success: true,
        message: 'Paket Kuis berhasil disiapkan.',
        data: {
            category,
            level,
            total_questions: selection.totalQuestions,
            session_expires_at: new Date(expiresAt).toISOString(),
            session_token: sessionToken,
            items: selection.selectedItems.map(toPublicItem)
        }
    });
});
exports.submitQuiz = asyncHandler(async (req, res) => {
    const { session_token, answers } = req.body || {};

    if (
        typeof session_token !== 'string' ||
        !Array.isArray(answers)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Token sesi dan daftar jawaban wajib dikirim.'
        });
    }

    let snapshot;

    try {
        snapshot = decryptSnapshot(session_token);
    } catch (error) {
        if (error.code === 'QUIZ_SESSION_EXPIRED') {
            return res.status(410).json({
                success: false,
                code: error.code,
                message: 'Sesi kuis telah kedaluwarsa. Silakan mulai latihan kembali.'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Snapshot kuis tidak valid atau telah diubah.'
        });
    }

    const answerMap = new Map();

    for (const item of answers) {
        const questionId = String(item?.question_id || '');

        if (!questionId || answerMap.has(questionId)) {
            return res.status(400).json({
                success: false,
                message: 'Daftar jawaban tidak valid atau memiliki soal duplikat.'
            });
        }

        answerMap.set(
            questionId,
            normalizeAnswerSet(item?.answers)
        );
    }

    const validQuestionIds = new Set(
        snapshot.questions.map((question) => String(question.id))
    );

    for (const questionId of answerMap.keys()) {
        if (!validQuestionIds.has(questionId)) {
            return res.status(400).json({
                success: false,
                message: 'Terdapat jawaban untuk soal yang tidak termasuk dalam sesi.'
            });
        }
    }

    const results = snapshot.questions.map((question) => {
        const selectedAnswers = answerMap.get(String(question.id)) || [];
        const correctAnswers = question.correct_answer || [];

        const isCorrect =
            selectedAnswers.length === correctAnswers.length &&
            selectedAnswers.every(
                (answer, index) => answer === correctAnswers[index]
            );

        return {
            question_id: question.id,
            selected_answers: selectedAnswers,
            correct_answers: correctAnswers,
            is_correct: isCorrect,
            explanation: question.explanation,
            recommendation_material: question.recommendation_material
        };
    });

    const correctCount = results.filter(
        (result) => result.is_correct
    ).length;

    const totalQuestions = results.length;

    return res.status(200).json({
        success: true,
        message: 'Jawaban Kuis berhasil diperiksa.',
        data: {
            category: snapshot.category,
            level: snapshot.level,
            total_questions: totalQuestions,
            correct_answers: correctCount,
            incorrect_answers: totalQuestions - correctCount,
            score: totalQuestions > 0
                ? Math.round((correctCount / totalQuestions) * 100)
                : 0,
            results
        }
    });
});


