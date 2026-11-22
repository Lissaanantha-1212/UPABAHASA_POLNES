const crypto = require('crypto');
const db = require('../config/db.pg');
const storageService = require('../services/storageService');

const AUDIO_BUCKET = 'quiz-audio';

const AUDIO_EXTENSIONS = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a'
};

const isQuizAudioStoragePath = (value) => {
  return (
    typeof value === 'string' &&
    /^listening\/[0-9a-f-]+\.(mp3|wav|m4a)$/i.test(value)
  );
};

// ======================================
// HELPER: BACA DURASI AUDIO DARI BUFFER
// ======================================

const getAudioDuration = async (fileBuffer, mimeType) => {
  try {
    if (!Buffer.isBuffer(fileBuffer) || !AUDIO_EXTENSIONS[mimeType]) {
      throw new Error('Buffer atau format audio tidak valid.');
    }

    const { parseBuffer } = await import('music-metadata');
    const metadata = await parseBuffer(fileBuffer, mimeType);
    const duration = metadata.format.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Durasi audio tidak dapat dibaca.');
    }

    return Math.ceil(duration);
  } catch (error) {
    console.error('Read Audio Duration Error:', error);
    throw new Error('Gagal membaca durasi file audio.');
  }
};

// ======================================
// HELPER: UPLOAD AUDIO LISTENING
// ======================================

const uploadListeningAudioToStorage = async (file) => {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    !AUDIO_EXTENSIONS[file.mimetype]
  ) {
    throw new Error('File audio Listening tidak valid.');
  }

  const extension = AUDIO_EXTENSIONS[file.mimetype];
  const objectPath = `listening/${crypto.randomUUID()}${extension}`;

  const contentType = file.mimetype === 'audio/mp3'
    ? 'audio/mpeg'
    : file.mimetype;

  await storageService.uploadObject({
    bucket: AUDIO_BUCKET,
    objectPath,
    fileBuffer: file.buffer,
    contentType,
    upsert: false
  });

  return objectPath;
};

// ======================================
// HELPER: FORMAT URL AUDIO
// ======================================

const formatAudioUrl = (audioFile, req) => {
  if (!audioFile || typeof audioFile !== 'string') {
    return null;
  }

  if (/^https?:\/\//i.test(audioFile)) {
    return audioFile;
  }

  const normalized = audioFile.replace(/\\/g, '/');

  // Pertahankan akses file lokal lama selama masa migrasi.
  if (
    normalized.startsWith('uploads/quizzes/listening/') ||
    normalized.startsWith('/uploads/quizzes/listening/')
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/${normalized.replace(/^\/+/, '')}`;
  }

  if (!isQuizAudioStoragePath(normalized)) {
    return null;
  }

  return storageService.getPublicUrl(AUDIO_BUCKET, normalized);
};

// ======================================
// HELPER: HAPUS AUDIO STORAGE JIKA TIDAK DIREFERENSIKAN
// ======================================

const removeQuizAudioIfUnreferenced = async (objectPath) => {
  if (!isQuizAudioStoragePath(objectPath)) {
    // File lokal lama sengaja dipertahankan.
    return false;
  }

  try {
    const referenceResult = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM public.quiz_packages
       WHERE audio_file = $1`,
      [objectPath]
    );

    if (referenceResult.rows[0].total > 0) {
      console.log(
        `Audio masih digunakan, tidak dihapus: ${objectPath}`
      );
      return false;
    }

    await storageService.removeObject(AUDIO_BUCKET, objectPath);

    console.log(`Audio Storage berhasil dihapus: ${objectPath}`);
    return true;
  } catch (error) {
    console.error(
      `Gagal membersihkan audio Storage ${objectPath}:`,
      error.message
    );

    return false;
  }
};

// ======================================
// HELPER: FORMAT PAKET LISTENING
// ======================================
// HELPER: FORMAT PAKET LISTENING
// ======================================

const formatPackage = (item, req) => ({
  id: item.id,
  category: item.category,
  level: item.level,
  name: item.name,
  audioFile: item.audio_file,
  audioUrl: formatAudioUrl(item.audio_file, req),
  audioDurationSeconds: item.audio_duration_seconds
    ? Number(item.audio_duration_seconds)
    : 0,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  questions: item.questions || [],
  totalQuestions: (item.questions || []).length
});

// ======================================
// HELPER: FORMAT PAKET READING
// ======================================

const formatReadingPackage = (item) => ({
  id: item.id,
  category: item.category,
  level: item.level,
  name: item.name,
  readingInstruction: item.reading_instruction || '',
  readingText: item.reading_text || '',
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  questions: item.questions || [],
  totalQuestions: (item.questions || []).length
});

// ======================================
// HELPER: VALIDASI ID
// ======================================

const parsePositiveId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// ======================================
// HELPER: PARSE SOAL
// ======================================

const parseQuestions = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
};

// ======================================
// HELPER: VALIDASI SOAL
// ======================================

const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'Minimal harus ada satu soal dalam paket.';
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionNumber = i + 1;

    if (!question || typeof question !== 'object') {
      return `Data soal nomor ${questionNumber} tidak valid.`;
    }

    if (
      !question.question_text ||
      typeof question.question_text !== 'string' ||
      !question.question_text.trim()
    ) {
      return `Pertanyaan nomor ${questionNumber} wajib diisi.`;
    }

    if (
      !question.subtopic_id ||
      !Number.isInteger(Number(question.subtopic_id)) ||
      Number(question.subtopic_id) <= 0
    ) {
      return `Subtopik soal nomor ${questionNumber} wajib dipilih.`;
    }

    const options =
      question.options &&
      typeof question.options === 'object' &&
      !Array.isArray(question.options)
        ? question.options
        : {};

    const availableOptions = ['A', 'B', 'C', 'D'].filter(
      (key) =>
        typeof options[key] === 'string' &&
        options[key].trim() !== ''
    );

    if (availableOptions.length < 2) {
      return `Soal nomor ${questionNumber} minimal harus memiliki 2 pilihan jawaban.`;
    }

    const expectedOptions = ['A', 'B', 'C', 'D'].slice(
      0,
      availableOptions.length
    );

    const isSequential = availableOptions.every(
      (option, index) => option === expectedOptions[index]
    );

    if (!isSequential) {
      return `Pilihan jawaban soal nomor ${questionNumber} harus berurutan mulai dari A.`;
    }

    if (!availableOptions.includes(question.correct_answer)) {
      return `Kunci jawaban soal nomor ${questionNumber} harus sesuai dengan pilihan yang tersedia.`;
    }
  }

  return null;
};

// ======================================
// HELPER: VALIDASI SUBTOPIK
// ======================================

const validateSubtopics = async (connection, questions, category) => {
  const subtopicIds = [
    ...new Set(
      questions.map((question) => Number(question.subtopic_id))
    )
  ];

  if (
    subtopicIds.some(
      (id) => !Number.isSafeInteger(id) || id <= 0
    )
  ) {
    return false;
  }

  const result = await connection.query(
    `SELECT id
     FROM public.quiz_subtopics
     WHERE category = $1
       AND is_active = TRUE
       AND id = ANY($2::int[])`,
    [category, subtopicIds]
  );

  return result.rows.length === subtopicIds.length;
};

const validateListeningSubtopics = (connection, questions) =>
  validateSubtopics(connection, questions, 'listening');

const validateReadingSubtopics = (connection, questions) =>
  validateSubtopics(connection, questions, 'reading');

// ======================================
// HELPER: AMBIL SOAL DALAM PAKET
// ======================================

const getPackageQuestions = async (connection, packageId) => {
  const result = await connection.query(
    `SELECT
       q.id,
       q.package_id,
       q.subtopic_id,
       COALESCE(s.name, q.subtopic) AS subtopic,
       q.question_text,
       q.options,
       q.correct_answer,
       q.explanation,
       q.created_at,
       q.updated_at
     FROM public.quiz_questions q
     LEFT JOIN public.quiz_subtopics s
       ON s.id = q.subtopic_id
     WHERE q.package_id = $1
     ORDER BY q.id ASC`,
    [packageId]
  );

  return result.rows.map((question) => {
    let options = {};

    try {
      options =
        typeof question.options === 'string'
          ? JSON.parse(question.options)
          : question.options;
    } catch {
      options = {};
    }

    return {
      id: question.id,
      package_id: question.package_id,
      subtopic_id: question.subtopic_id,
      subtopic: question.subtopic,
      question_text: question.question_text,
      options,
      correct_answer: question.correct_answer,
      explanation: question.explanation
    };
  });
};

// ======================================
// HELPER: SIMPAN SOAL KE PAKET
// ======================================

const insertPackageQuestions = async (
  connection,
  packageId,
  questions,
  category
) => {
  for (const question of questions) {
    const subtopicResult = await connection.query(
      `SELECT name
       FROM public.quiz_subtopics
       WHERE id = $1
         AND category = $2
         AND is_active = TRUE`,
      [Number(question.subtopic_id), category]
    );

    if (subtopicResult.rows.length === 0) {
      throw new Error(
        `Subtopik ${category} tidak ditemukan atau tidak aktif.`
      );
    }

    await connection.query(
      `INSERT INTO public.quiz_questions
        (
          package_id,
          subtopic_id,
          subtopic,
          question_text,
          options,
          correct_answer,
          explanation
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        packageId,
        Number(question.subtopic_id),
        subtopicResult.rows[0].name,
        question.question_text.trim(),
        JSON.stringify(question.options),
        question.correct_answer,
        question.explanation?.trim() || null
      ]
    );
  }
};

// ======================================
// HELPER: ROLLBACK AMAN
// ======================================

const rollbackQuietly = async (connection) => {
  if (!connection) return;

  try {
    await connection.query('ROLLBACK');
  } catch (error) {
    console.error('Rollback Error:', error.message);
  }
};

// ======================================
// GET: SEMUA PAKET LISTENING
// ======================================

exports.getListeningPackages = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM public.quiz_packages
       WHERE category = 'listening'
       ORDER BY created_at DESC`
    );

    const data = await Promise.all(
      result.rows.map(async (item) => {
        const questions = await getPackageQuestions(db, item.id);

        return formatPackage(
          { ...item, questions },
          req
        );
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Data paket Listening berhasil diambil.',
      data
    });
  } catch (error) {
    console.error('Get Listening Packages Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data paket Listening.'
    });
  }
};

// ======================================
// GET: DETAIL PAKET LISTENING
// ======================================

exports.getListeningPackageById = async (req, res) => {
  try {
    const id = parsePositiveId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID paket tidak valid.'
      });
    }

    const result = await db.query(
      `SELECT *
       FROM public.quiz_packages
       WHERE id = $1
         AND category = 'listening'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paket Listening tidak ditemukan.'
      });
    }

    const questions = await getPackageQuestions(db, id);

    return res.status(200).json({
      success: true,
      message: 'Detail paket Listening berhasil diambil.',
      data: formatPackage(
        { ...result.rows[0], questions },
        req
      )
    });
  } catch (error) {
    console.error('Get Listening Detail Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail paket Listening.'
    });
  }
};

// ======================================
// GET: SUBTOPIK LISTENING
// ======================================

exports.getListeningSubtopics = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, category, name, description
       FROM public.quiz_subtopics
       WHERE category = 'listening'
         AND is_active = TRUE
       ORDER BY name ASC`
    );

    return res.status(200).json({
      success: true,
      message: 'Subtopik Listening berhasil diambil.',
      data: result.rows
    });
  } catch (error) {
    console.error('Get Listening Subtopics Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil subtopik Listening.'
    });
  }
};

// ======================================
// POST: TAMBAH PAKET LISTENING
// ======================================

exports.createListeningPackage = async (req, res) => {
  let connection;
  let uploadedAudioPath = null;
  let committed = false;

  try {
    const {
      name,
      level,
      questions: questionsValue
    } = req.body;

    const audioFile = req.file;
    const questions = parseQuestions(questionsValue);

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama paket wajib diisi.'
      });
    }

    if (!['singkat', 'sedang', 'panjang'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Level paket tidak valid.'
      });
    }

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        message: 'File audio Listening wajib diunggah.'
      });
    }

    const questionError = validateQuestions(questions);

    if (questionError) {
      return res.status(400).json({
        success: false,
        message: questionError
      });
    }

    const audioDuration = await getAudioDuration(
      audioFile.buffer,
      audioFile.mimetype
    );

    uploadedAudioPath = await uploadListeningAudioToStorage(audioFile);

    connection = await db.connect();
    await connection.query('BEGIN');

    const validSubtopics = await validateListeningSubtopics(
      connection,
      questions
    );

    if (!validSubtopics) {
      await rollbackQuietly(connection);

      await removeQuizAudioIfUnreferenced(uploadedAudioPath);
      uploadedAudioPath = null;

      return res.status(400).json({
        success: false,
        message: 'Terdapat subtopik Listening yang tidak valid atau tidak aktif.'
      });
    }

    const packageResult = await connection.query(
      `INSERT INTO public.quiz_packages
        (
          category,
          level,
          name,
          audio_file,
          audio_duration_seconds
        )
       VALUES ('listening', $1, $2, $3, $4)
       RETURNING id`,
      [
        level,
        name.trim(),
        uploadedAudioPath,
        audioDuration
      ]
    );

    const packageId = packageResult.rows[0].id;

    await insertPackageQuestions(
      connection,
      packageId,
      questions,
      'listening'
    );

    await connection.query('COMMIT');
    committed = true;

    const createdResult = await db.query(
      'SELECT * FROM public.quiz_packages WHERE id = $1',
      [packageId]
    );

    const createdQuestions = await getPackageQuestions(
      db,
      packageId
    );

    return res.status(201).json({
      success: true,
      message: 'Paket Listening berhasil ditambahkan.',
      data: formatPackage(
        {
          ...createdResult.rows[0],
          questions: createdQuestions
        },
        req
      )
    });
  } catch (error) {
    if (connection && !committed) {
      await rollbackQuietly(connection);
    }

    if (uploadedAudioPath && !committed) {
      await removeQuizAudioIfUnreferenced(uploadedAudioPath);
    }

    console.error('Create Listening Package Error:', error);

    return res.status(500).json({
      success: false,
      message:
        error.message === 'Gagal membaca durasi file audio.'
          ? error.message
          : 'Gagal menambahkan paket Listening.'
    });
  } finally {
    if (connection) connection.release();
  }
};

// ======================================
// PUT: EDIT PAKET LISTENING
// ======================================

exports.updateListeningPackage = async (req, res) => {
  let connection;
  let uploadedAudioPath = null;
  let committed = false;
  let oldAudioPath = null;

  try {
    const id = parsePositiveId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID paket tidak valid.'
      });
    }

    const {
      name,
      level,
      questions: questionsValue
    } = req.body;

    const audioFile = req.file;
    const questions = parseQuestions(questionsValue);

    if (questionsValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Data soal wajib dikirim saat memperbarui paket.'
      });
    }

    const questionError = validateQuestions(questions);

    if (questionError) {
      return res.status(400).json({
        success: false,
        message: questionError
      });
    }

    if (name !== undefined && (
      typeof name !== 'string' || !name.trim()
    )) {
      return res.status(400).json({
        success: false,
        message: 'Nama paket tidak valid.'
      });
    }

    if (
      level !== undefined &&
      !['singkat', 'sedang', 'panjang'].includes(level)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Level paket tidak valid.'
      });
    }

    const newAudioDuration = audioFile
      ? await getAudioDuration(audioFile.buffer, audioFile.mimetype)
      : null;

    if (audioFile) {
      uploadedAudioPath = await uploadListeningAudioToStorage(audioFile);
    }

    connection = await db.connect();
    await connection.query('BEGIN');

    const existingResult = await connection.query(
      `SELECT *
       FROM public.quiz_packages
       WHERE id = $1
         AND category = 'listening'
       FOR UPDATE`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      await rollbackQuietly(connection);

      if (uploadedAudioPath) {
        await removeQuizAudioIfUnreferenced(uploadedAudioPath);
        uploadedAudioPath = null;
      }

      return res.status(404).json({
        success: false,
        message: 'Paket Listening tidak ditemukan.'
      });
    }

    const existing = existingResult.rows[0];
    oldAudioPath = existing.audio_file;

    const newName = name === undefined
      ? existing.name
      : name.trim();

    const newLevel = level === undefined
      ? existing.level
      : level;

    const newAudioPath = uploadedAudioPath || existing.audio_file;

    const audioDuration = audioFile
      ? newAudioDuration
      : Number(existing.audio_duration_seconds || 0);

    const validSubtopics = await validateListeningSubtopics(
      connection,
      questions
    );

    if (!validSubtopics) {
      await rollbackQuietly(connection);

      if (uploadedAudioPath) {
        await removeQuizAudioIfUnreferenced(uploadedAudioPath);
        uploadedAudioPath = null;
      }

      return res.status(400).json({
        success: false,
        message: 'Terdapat subtopik Listening yang tidak valid atau tidak aktif.'
      });
    }

    await connection.query(
      `UPDATE public.quiz_packages
       SET name = $1,
           level = $2,
           audio_file = $3,
           audio_duration_seconds = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
         AND category = 'listening'`,
      [
        newName,
        newLevel,
        newAudioPath,
        audioDuration,
        id
      ]
    );

    await connection.query(
      'DELETE FROM public.quiz_questions WHERE package_id = $1',
      [id]
    );

    await insertPackageQuestions(
      connection,
      id,
      questions,
      'listening'
    );

    await connection.query('COMMIT');
    committed = true;

    if (
      uploadedAudioPath &&
      oldAudioPath &&
      oldAudioPath !== uploadedAudioPath
    ) {
      await removeQuizAudioIfUnreferenced(oldAudioPath);
    }

    const updatedResult = await db.query(
      'SELECT * FROM public.quiz_packages WHERE id = $1',
      [id]
    );

    const updatedQuestions = await getPackageQuestions(db, id);

    return res.status(200).json({
      success: true,
      message: 'Paket Listening berhasil diperbarui.',
      data: formatPackage(
        {
          ...updatedResult.rows[0],
          questions: updatedQuestions
        },
        req
      )
    });
  } catch (error) {
    if (connection && !committed) {
      await rollbackQuietly(connection);
    }

    if (uploadedAudioPath && !committed) {
      await removeQuizAudioIfUnreferenced(uploadedAudioPath);
    }

    console.error('Update Listening Package Error:', error);

    return res.status(500).json({
      success: false,
      message:
        error.message === 'Gagal membaca durasi file audio.'
          ? error.message
          : 'Gagal memperbarui paket Listening.'
    });
  } finally {
    if (connection) connection.release();
  }
};

// ======================================
// DELETE: HAPUS PAKET LISTENING
// ======================================

exports.deleteListeningPackage = async (req, res) => {
  let connection;
  let committed = false;

  try {
    const id = parsePositiveId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID paket tidak valid.'
      });
    }

    connection = await db.connect();
    await connection.query('BEGIN');

    const packageResult = await connection.query(
      `SELECT id, audio_file
       FROM public.quiz_packages
       WHERE id = $1
         AND category = 'listening'
       FOR UPDATE`,
      [id]
    );

    if (packageResult.rows.length === 0) {
      await rollbackQuietly(connection);

      return res.status(404).json({
        success: false,
        message: 'Paket Listening tidak ditemukan.'
      });
    }

    const packageData = packageResult.rows[0];

    const questionCountResult = await connection.query(
      `SELECT COUNT(*)::int AS total
       FROM public.quiz_questions
       WHERE package_id = $1`,
      [id]
    );

    const deletedQuestions = questionCountResult.rows[0].total;

    // FK quiz_questions.package_id ON DELETE CASCADE
    const deleteResult = await connection.query(
      `DELETE FROM public.quiz_packages
       WHERE id = $1
         AND category = 'listening'
       RETURNING id`,
      [id]
    );

    if (deleteResult.rowCount !== 1) {
      throw new Error('Paket Listening gagal dihapus.');
    }

    await connection.query('COMMIT');
    committed = true;

    await removeQuizAudioIfUnreferenced(packageData.audio_file);

    console.log(`Paket Listening ID ${id} berhasil dihapus.`);

    return res.status(200).json({
      success: true,
      message: 'Paket Listening dan seluruh soalnya berhasil dihapus.',
      deletedPackageId: id,
      deletedQuestions,
      deletedPackages: deleteResult.rowCount
    });
  } catch (error) {
    if (connection && !committed) {
      await rollbackQuietly(connection);
    }

    console.error('Delete Listening Package Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus paket Listening.'
    });
  } finally {
    if (connection) connection.release();
  }
};

// ======================================
// GET: SEMUA PAKET READING
// ======================================

exports.getReadingPackages = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM public.quiz_packages
       WHERE category = 'reading'
       ORDER BY created_at DESC`
    );

    const data = await Promise.all(
      result.rows.map(async (item) => {
        const questions = await getPackageQuestions(db, item.id);

        return formatReadingPackage({
          ...item,
          questions
        });
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Data paket Reading berhasil diambil.',
      data
    });
  } catch (error) {
    console.error('Get Reading Packages Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data paket Reading.'
    });
  }
};

// ======================================
// GET: DETAIL PAKET READING
// ======================================

exports.getReadingPackageById = async (req, res) => {
  try {
    const id = parsePositiveId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID paket tidak valid.'
      });
    }

    const result = await db.query(
      `SELECT *
       FROM public.quiz_packages
       WHERE id = $1
         AND category = 'reading'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paket Reading tidak ditemukan.'
      });
    }

    const questions = await getPackageQuestions(db, id);

    return res.status(200).json({
      success: true,
      message: 'Detail paket Reading berhasil diambil.',
      data: formatReadingPackage({
        ...result.rows[0],
        questions
      })
    });
  } catch (error) {
    console.error('Get Reading Detail Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail paket Reading.'
    });
  }
};

// ======================================
// GET: SUBTOPIK READING
// ======================================

exports.getReadingSubtopics = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, category, name, description
       FROM public.quiz_subtopics
       WHERE category = 'reading'
         AND is_active = TRUE
       ORDER BY name ASC`
    );

    return res.status(200).json({
      success: true,
      message: 'Subtopik Reading berhasil diambil.',
      data: result.rows
    });
  } catch (error) {
    console.error('Get Reading Subtopics Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil subtopik Reading.'
    });
  }
};

// ======================================
// POST: TAMBAH PAKET READING
// ======================================

exports.createReadingPackage = async (req, res) => {
  let connection;
  let committed = false;

  try {
    const {
      name,
      level,
      readingInstruction,
      readingText,
      questions: questionsValue
    } = req.body;

    const questions = parseQuestions(questionsValue);

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama paket wajib diisi.'
      });
    }

    if (!['singkat', 'sedang', 'panjang'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Level paket tidak valid.'
      });
    }

    if (
      typeof readingText !== 'string' ||
      !readingText.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Teks bacaan wajib diisi.'
      });
    }

    if (
      readingInstruction !== undefined &&
      typeof readingInstruction !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Petunjuk teks tidak valid.'
      });
    }

    const questionError = validateQuestions(questions);

    if (questionError) {
      return res.status(400).json({
        success: false,
        message: questionError
      });
    }

    connection = await db.connect();
    await connection.query('BEGIN');

    const validSubtopics = await validateReadingSubtopics(
      connection,
      questions
    );

    if (!validSubtopics) {
      await rollbackQuietly(connection);

      return res.status(400).json({
        success: false,
        message: 'Terdapat subtopik Reading yang tidak valid atau tidak aktif.'
      });
    }

    const packageResult = await connection.query(
      `INSERT INTO public.quiz_packages
        (
          category,
          level,
          name,
          reading_text,
          reading_instruction
        )
       VALUES ('reading', $1, $2, $3, $4)
       RETURNING id`,
      [
        level,
        name.trim(),
        readingText.trim(),
        readingInstruction?.trim() || null
      ]
    );

    const packageId = packageResult.rows[0].id;

    await insertPackageQuestions(
      connection,
      packageId,
      questions,
      'reading'
    );

    await connection.query('COMMIT');
    committed = true;

    const createdResult = await db.query(
      'SELECT * FROM public.quiz_packages WHERE id = $1',
      [packageId]
    );

    const createdQuestions = await getPackageQuestions(
      db,
      packageId
    );

    return res.status(201).json({
      success: true,
      message: 'Paket Reading berhasil ditambahkan.',
      data: formatReadingPackage({
        ...createdResult.rows[0],
        questions: createdQuestions
      })
    });
  } catch (error) {
    if (connection && !committed) {
      await rollbackQuietly(connection);
    }

    console.error('Create Reading Package Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan paket Reading.'
    });
  } finally {
    if (connection) connection.release();
  }
};

// ======================================
// PUT: EDIT PAKET READING
// ======================================

exports.updateReadingPackage = async (req, res) => {
  let connection;
  let committed = false;

  try {
    const id = parsePositiveId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID paket tidak valid.'
      });
    }

    const {
      name,
      level,
      readingInstruction,
      readingText,
      questions: questionsValue
    } = req.body;

    if (questionsValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Data soal wajib dikirim saat memperbarui paket.'
      });
    }

    const questions = parseQuestions(questionsValue);
    const questionError = validateQuestions(questions);

    if (questionError) {
      return res.status(400).json({
        success: false,
        message: questionError
      });
    }

    if (name !== undefined && (
      typeof name !== 'string' || !name.trim()
    )) {
      return res.status(400).json({
        success: false,
        message: 'Nama paket tidak valid.'
      });
    }

    if (
      level !== undefined &&
      !['singkat', 'sedang', 'panjang'].includes(level)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Level paket tidak valid.'
      });
    }

    if (
      readingText !== undefined &&
      (typeof readingText !== 'string' || !readingText.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Teks bacaan wajib diisi.'
      });
    }

    if (
      readingInstruction !== undefined &&
      typeof readingInstruction !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Petunjuk teks tidak valid.'
      });
    }

    connection = await db.connect();
    await connection.query('BEGIN');

    const existingResult = await connection.query(
      `SELECT *
       FROM public.quiz_packages
       WHERE id = $1
         AND category = 'reading'
       FOR UPDATE`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      await rollbackQuietly(connection);

      return res.status(404).json({
        success: false,
        message: 'Paket Reading tidak ditemukan.'
      });
    }

    const existing = existingResult.rows[0];

    const newName = name === undefined
      ? existing.name
      : name.trim();

    const newLevel = level === undefined
      ? existing.level
      : level;

    const newReadingText = readingText === undefined
      ? existing.reading_text
      : readingText.trim();

    const newReadingInstruction = readingInstruction === undefined
      ? existing.reading_instruction
      : readingInstruction.trim() || null;

    if (!newReadingText) {
      await rollbackQuietly(connection);

      return res.status(400).json({
        success: false,
        message: 'Teks bacaan wajib diisi.'
      });
    }

    const validSubtopics = await validateReadingSubtopics(
      connection,
      questions
    );

    if (!validSubtopics) {
      await rollbackQuietly(connection);

      return res.status(400).json({
        success: false,
        message: 'Terdapat subtopik Reading yang tidak valid atau tidak aktif.'
      });
    }

    await connection.query(
      `UPDATE public.quiz_packages
       SET name = $1,
           level = $2,
           reading_text = $3,
           reading_instruction = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
         AND category = 'reading'`,
      [
        newName,
        newLevel,
        newReadingText,
        newReadingInstruction,
        id
      ]
    );

    await connection.query(
      'DELETE FROM public.quiz_questions WHERE package_id = $1',
      [id]
    );

    await insertPackageQuestions(
      connection,
      id,
      questions,
      'reading'
    );

    await connection.query('COMMIT');
    committed = true;

    const updatedResult = await db.query(
      'SELECT * FROM public.quiz_packages WHERE id = $1',
      [id]
    );

    const updatedQuestions = await getPackageQuestions(db, id);

    return res.status(200).json({
      success: true,
      message: 'Paket Reading berhasil diperbarui.',
      data: formatReadingPackage({
        ...updatedResult.rows[0],
        questions: updatedQuestions
      })
    });
  } catch (error) {
    if (connection && !committed) {
      await rollbackQuietly(connection);
    }

    console.error('Update Reading Package Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui paket Reading.'
    });
  } finally {
    if (connection) connection.release();
  }
};

// ======================================
// DELETE: HAPUS PAKET READING
// ======================================

exports.deleteReadingPackage = async (req, res) => {
  let connection;
  let committed = false;

  try {
    const id = parsePositiveId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID paket tidak valid.'
      });
    }

    connection = await db.connect();
    await connection.query('BEGIN');

    const packageResult = await connection.query(
      `SELECT id
       FROM public.quiz_packages
       WHERE id = $1
         AND category = 'reading'
       FOR UPDATE`,
      [id]
    );

    if (packageResult.rows.length === 0) {
      await rollbackQuietly(connection);

      return res.status(404).json({
        success: false,
        message: 'Paket Reading tidak ditemukan.'
      });
    }

    const questionCountResult = await connection.query(
      `SELECT COUNT(*)::int AS total
       FROM public.quiz_questions
       WHERE package_id = $1`,
      [id]
    );

    const deletedQuestions = questionCountResult.rows[0].total;

    // FK quiz_questions.package_id ON DELETE CASCADE
    const deleteResult = await connection.query(
      `DELETE FROM public.quiz_packages
       WHERE id = $1
         AND category = 'reading'
       RETURNING id`,
      [id]
    );

    if (deleteResult.rowCount !== 1) {
      throw new Error('Paket Reading gagal dihapus.');
    }

    await connection.query('COMMIT');
    committed = true;

    console.log(`Paket Reading ID ${id} berhasil dihapus.`);

    return res.status(200).json({
      success: true,
      message: 'Paket Reading dan seluruh soalnya berhasil dihapus.',
      deletedPackageId: id,
      deletedQuestions,
      deletedPackages: deleteResult.rowCount
    });
  } catch (error) {
    if (connection && !committed) {
      await rollbackQuietly(connection);
    }

    console.error('Delete Reading Package Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus paket Reading.'
    });
  } finally {
    if (connection) connection.release();
  }
};
