
const db = require('../config/db.pg');

// ======================================
// KONFIGURASI DAN HELPER
// ======================================

const VALID_CATEGORIES = [
  'listening',
  'reading',
  'structure'
];

const parseId = (value) => {
  const id = Number(value);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
};

const parseActiveStatus = (value) => {
  if (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true'
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === '0' ||
    value === 'false'
  ) {
    return false;
  }

  return null;
};

const parseOptionalDescription = (value, fallback = null) => {
  if (value === undefined) {
    return fallback;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim() || null;
};

const rollbackTransaction = async (client, transactionStarted) => {
  if (transactionStarted && client) {
    await client.query('ROLLBACK');
  }
};

const getSubtopicUsage = async (client, id) => {
  const result = await client.query(
    `SELECT
      (
        SELECT COUNT(*)::INTEGER
        FROM public.quiz_questions
        WHERE subtopic_id = $1
      ) AS total_questions,
      (
        SELECT COUNT(*)::INTEGER
        FROM public.quiz_recommendations
        WHERE subtopic_id = $1
      ) AS total_recommendations`,
    [id]
  );

  return {
    totalQuestions: Number(result.rows[0].total_questions),
    totalRecommendations: Number(result.rows[0].total_recommendations)
  };
};

// ======================================
// GET: SEMUA SUBTOPIK
// ======================================

exports.getAllSubtopics = async (req, res) => {
  try {
    const { category, status } = req.query;

    const params = [];
    let sql = `
      SELECT
        s.id,
        s.category,
        s.name,
        s.description,
        s.is_active,
        s.created_at,
        s.updated_at,
        (
          SELECT COUNT(*)::INTEGER
          FROM public.quiz_questions q
          WHERE q.subtopic_id = s.id
        ) AS total_questions,
        (
          SELECT COUNT(*)::INTEGER
          FROM public.quiz_recommendations r
          WHERE r.subtopic_id = s.id
        ) AS total_recommendations
      FROM public.quiz_subtopics s
      WHERE 1 = 1
    `;

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Kategori subtopik tidak valid.'
        });
      }

      params.push(category);
      sql += ` AND s.category = $${params.length}`;
    }

    if (status !== undefined) {
      const activeStatus = parseActiveStatus(status);

      if (activeStatus === null) {
        return res.status(400).json({
          success: false,
          message: 'Filter status tidak valid.'
        });
      }

      params.push(activeStatus);
      sql += ` AND s.is_active = $${params.length}`;
    }

    sql += `
      ORDER BY
        CASE s.category
          WHEN 'listening' THEN 1
          WHEN 'reading' THEN 2
          WHEN 'structure' THEN 3
          ELSE 4
        END,
        s.name ASC
    `;

    const result = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Data subtopik berhasil diambil.',
      data: result.rows
    });
  } catch (error) {
    console.error('Get All Subtopics Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data subtopik.'
    });
  }
};

// ======================================
// GET: DETAIL SUBTOPIK
// ======================================

exports.getSubtopicById = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID subtopik tidak valid.'
      });
    }

    const result = await db.query(
      `SELECT
        s.id,
        s.category,
        s.name,
        s.description,
        s.is_active,
        s.created_at,
        s.updated_at,
        (
          SELECT COUNT(*)::INTEGER
          FROM public.quiz_questions q
          WHERE q.subtopic_id = s.id
        ) AS total_questions,
        (
          SELECT COUNT(*)::INTEGER
          FROM public.quiz_recommendations r
          WHERE r.subtopic_id = s.id
        ) AS total_recommendations
       FROM public.quiz_subtopics s
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtopik tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Detail subtopik berhasil diambil.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get Subtopic Detail Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail subtopik.'
    });
  }
};

// ======================================
// POST: TAMBAH SUBTOPIK
// ======================================

exports.createSubtopic = async (req, res) => {
  try {
    const { category, name, description } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Pilih kategori Listening, Reading, atau Structure.'
      });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nama subtopik wajib diisi.'
      });
    }

    const cleanName = name.trim();

    if (cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Nama subtopik maksimal 150 karakter.'
      });
    }

    const cleanDescription = parseOptionalDescription(description);

    if (cleanDescription === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Deskripsi subtopik tidak valid.'
      });
    }

    const result = await db.query(
      `INSERT INTO public.quiz_subtopics (
        category,
        name,
        description,
        is_active
      )
      VALUES ($1, $2, $3, TRUE)
      RETURNING
        id,
        category,
        name,
        description,
        is_active,
        created_at,
        updated_at`,
      [category, cleanName, cleanDescription]
    );

    return res.status(201).json({
      success: true,
      message: 'Subtopik berhasil ditambahkan.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create Subtopic Error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Subtopik dengan nama tersebut sudah tersedia pada kategori ini.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan subtopik.'
    });
  }
};

// ======================================
// PUT: EDIT SUBTOPIK
// ======================================

exports.updateSubtopic = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID subtopik tidak valid.'
      });
    }

    const {
      category,
      name,
      description,
      is_active
    } = req.body;

    client = await db.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    // Kunci baris subtopik selama proses perubahan.
    const existingResult = await client.query(
      `SELECT *
       FROM public.quiz_subtopics
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: 'Subtopik tidak ditemukan.'
      });
    }

    const existing = existingResult.rows[0];

    const newCategory = category === undefined
      ? existing.category
      : category;

    const newName = name === undefined
      ? existing.name
      : typeof name === 'string'
        ? name.trim()
        : '';

    const newDescription = parseOptionalDescription(
      description,
      existing.description
    );

    const newStatus = is_active === undefined
      ? existing.is_active
      : parseActiveStatus(is_active);

    // Validasi kategori.
    if (!VALID_CATEGORIES.includes(newCategory)) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: 'Kategori subtopik tidak valid.'
      });
    }

    // Validasi nama.
    if (!newName) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: 'Nama subtopik wajib diisi.'
      });
    }

    if (newName.length > 150) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: 'Nama subtopik maksimal 150 karakter.'
      });
    }

    // Validasi deskripsi.
    if (newDescription === undefined) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: 'Deskripsi subtopik tidak valid.'
      });
    }

    // Validasi status.
    if (newStatus === null) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: 'Status subtopik tidak valid.'
      });
    }

    // Kategori tidak boleh berubah jika subtopik sudah digunakan.
    if (newCategory !== existing.category) {
      const usage = await getSubtopicUsage(client, id);

      if (
        usage.totalQuestions > 0 ||
        usage.totalRecommendations > 0
      ) {
        await rollbackTransaction(client, transactionStarted);
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'Kategori tidak dapat diubah karena subtopik sudah digunakan oleh soal atau rekomendasi.',
          data: usage
        });
      }
    }

    // Cek nama duplikat dalam kategori yang sama.
    const duplicateResult = await client.query(
      `SELECT id
       FROM public.quiz_subtopics
       WHERE category = $1
         AND LOWER(name) = LOWER($2)
         AND id <> $3
       LIMIT 1`,
      [newCategory, newName, id]
    );

    if (duplicateResult.rows.length > 0) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: 'Nama subtopik sudah digunakan pada kategori tersebut.'
      });
    }

    // Simpan perubahan.
    const result = await client.query(
      `UPDATE public.quiz_subtopics
       SET category = $1,
           name = $2,
           description = $3,
           is_active = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING
         id,
         category,
         name,
         description,
         is_active,
         created_at,
         updated_at`,
      [
        newCategory,
        newName,
        newDescription,
        newStatus,
        id
      ]
    );

    let deactivatedPackages = [];

    // Hanya jalankan cascade saat status berubah aktif -> nonaktif.
    if (existing.is_active === true && newStatus === false) {
      const packageResult = await client.query(
        `UPDATE public.quiz_packages p
         SET is_active = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE p.is_active = TRUE
           AND EXISTS (
             SELECT 1
             FROM public.quiz_questions q
             WHERE q.package_id = p.id
               AND q.subtopic_id = $1
           )
         RETURNING p.id, p.name`,
        [id]
      );

      deactivatedPackages = packageResult.rows;
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: deactivatedPackages.length > 0
        ? `Subtopik berhasil diperbarui. ${deactivatedPackages.length} paket terkait otomatis dinonaktifkan.`
        : 'Subtopik berhasil diperbarui.',
      data: {
        ...result.rows[0],
        deactivated_packages: deactivatedPackages
      }
    });
  } catch (error) {
    if (transactionStarted && client) {
      await rollbackTransaction(client, transactionStarted);
    }

    console.error('Update Subtopic Error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Nama subtopik sudah digunakan pada kategori tersebut.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui subtopik.'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// ======================================
// DELETE: HAPUS SUBTOPIK
// ======================================

exports.deleteSubtopic = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID subtopik tidak valid.'
      });
    }

    client = await db.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    // Kunci baris sebelum pemeriksaan dan penghapusan.
    const existingResult = await client.query(
      `SELECT id
       FROM public.quiz_subtopics
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: 'Subtopik tidak ditemukan.'
      });
    }

    const usage = await getSubtopicUsage(client, id);

    if (
      usage.totalQuestions > 0 ||
      usage.totalRecommendations > 0
    ) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: 'Subtopik tidak dapat dihapus karena masih digunakan.',
        data: usage
      });
    }

    const deleteResult = await client.query(
      `DELETE FROM public.quiz_subtopics
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (deleteResult.rows.length === 0) {
      await rollbackTransaction(client, transactionStarted);
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: 'Subtopik tidak ditemukan.'
      });
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      message: 'Subtopik berhasil dihapus.'
    });
  } catch (error) {
    if (transactionStarted && client) {
      await rollbackTransaction(client, transactionStarted);
    }

    console.error('Delete Subtopic Error:', error);

    // Foreign key masih melindungi relasi jika terjadi
    // perubahan data bersamaan.
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Subtopik tidak dapat dihapus karena masih memiliki data yang terhubung.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus subtopik.'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};
