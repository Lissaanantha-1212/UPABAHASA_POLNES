const db = require('../config/db.pg');
const ExcelJS = require('exceljs');

// ======================================
// KONFIGURASI PENILAIAN
// ======================================
const ratingLabels = {
  4: 'Sangat Baik',
  3: 'Baik',
  2: 'Kurang Baik',
  1: 'Tidak Baik'
};

const ratingValues = {
  'Sangat Baik': 4,
  'Baik': 3,
  'Kurang Baik': 2,
  'Tidak Baik': 1
};

const normalizeRating = (value) => {
  if (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ratingValues, value)
  ) {
    return ratingValues[value];
  }

  const number = Number(value);

  return Number.isInteger(number) && number >= 1 && number <= 4
    ? number
    : null;
};

const normalizeId = (value) => {
  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0
    ? number
    : null;
};

const slugify = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const validAspectKey = (value) => {
  return (
    typeof value === 'string' &&
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value)
  );
};

const optionalText = (value) => {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value.trim() || null : null;
};

// ======================================
// QUERY DATA SURVEI DINAMIS
// ======================================
const getSurveyData = async () => {
  const aspectsResult = await db.query(
    `SELECT
      id,
      aspect_key,
      label,
      english_label,
      description,
      display_order,
      is_active
    FROM public.survey_aspects
    ORDER BY display_order ASC, id ASC`
  );

  const responsesResult = await db.query(
    `SELECT
      s.id,
      s.comment,
      s.created_at,
      d.aspect_id,
      d.aspect_key_snapshot,
      d.aspect_label_snapshot,
      d.rating
    FROM public.surveys s
    LEFT JOIN public.survey_response_details d
      ON d.survey_id = s.id
    ORDER BY s.created_at DESC, s.id DESC, d.id ASC`
  );

  const aspectMap = new Map();
  aspectsResult.rows.forEach((aspect) => {
    aspectMap.set(Number(aspect.id), aspect);
  });

  const responseMap = new Map();

  responsesResult.rows.forEach((row) => {
    if (!responseMap.has(row.id)) {
      responseMap.set(row.id, {
        id: row.id,
        comment: row.comment,
        created_at: row.created_at,
        aspects: []
      });
    }

    if (row.aspect_id !== null) {
      responseMap.get(row.id).aspects.push({
        aspectId: Number(row.aspect_id),
        aspectKey: row.aspect_key_snapshot,
        aspectLabel: row.aspect_label_snapshot,
        rating: Number(row.rating),
        ratingLabel: ratingLabels[Number(row.rating)] || '-'
      });
    }
  });

  return {
    aspects: aspectsResult.rows,
    responses: Array.from(responseMap.values()),
    aspectMap
  };
};

// ======================================
// CONTROLLER SURVEI
// ======================================
const SurveyController = {

  // ======================================
  // 1. DAFTAR ASPEK AKTIF UNTUK MAHASISWA
  // ======================================
  getActiveAspects: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
          id,
          aspect_key AS "aspectKey",
          label,
          english_label AS "englishLabel",
          description,
          display_order AS "displayOrder"
        FROM public.survey_aspects
        WHERE is_active = TRUE
        ORDER BY display_order ASC, id ASC`
      );

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error mengambil aspek survei:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar aspek survei.'
      });
    }
  },

  // ======================================
  // 2. DAFTAR ASPEK UNTUK ADMIN
  // ======================================
  getAdminAspects: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
          a.id,
          a.aspect_key AS "aspectKey",
          a.label,
          a.english_label AS "englishLabel",
          a.description,
          a.display_order AS "displayOrder",
          a.is_active AS "isActive",
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          COUNT(d.id)::INTEGER AS "responseCount"
        FROM public.survey_aspects a
        LEFT JOIN public.survey_response_details d
          ON d.aspect_id = a.id
        GROUP BY a.id
        ORDER BY a.display_order ASC, a.id ASC`
      );

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error mengambil aspek admin:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar aspek.'
      });
    }
  },

  // ======================================
  // 3. TAMBAH ASPEK
  // ======================================
  createAspect: async (req, res) => {
    try {
      const {
        aspectKey,
        label,
        englishLabel,
        description,
        displayOrder,
        isActive
      } = req.body;

      if (typeof label !== 'string' || !label.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nama aspek wajib diisi.'
        });
      }

      const key = aspectKey
        ? String(aspectKey).trim()
        : slugify(label);

      if (!validAspectKey(key)) {
        return res.status(400).json({
          success: false,
          message: 'Kunci aspek hanya boleh berisi huruf kecil, angka, dan garis bawah.'
        });
      }

      const order = displayOrder === undefined
        ? 0
        : Number(displayOrder);

      if (!Number.isInteger(order) || order < 0) {
        return res.status(400).json({
          success: false,
          message: 'Urutan aspek harus berupa bilangan bulat minimal 0.'
        });
      }

      if (isActive !== undefined && typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Status aktif aspek tidak valid.'
        });
      }

      const result = await db.query(
        `INSERT INTO public.survey_aspects (
          aspect_key,
          label,
          english_label,
          description,
          display_order,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          aspect_key AS "aspectKey",
          label,
          english_label AS "englishLabel",
          description,
          display_order AS "displayOrder",
          is_active AS "isActive"`,
        [
          key,
          label.trim(),
          optionalText(englishLabel),
          optionalText(description),
          order,
          isActive === undefined ? true : isActive
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Aspek survei berhasil ditambahkan.',
        data: result.rows[0]
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Kunci aspek sudah digunakan. Gunakan kunci yang berbeda.'
        });
      }

      console.error('Error menambahkan aspek:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal menambahkan aspek survei.'
      });
    }
  },

  // ======================================
  // 4. EDIT ASPEK
  // KUNCI ASPEK TIDAK DAPAT DIUBAH
  // ======================================
  updateAspect: async (req, res) => {
    try {
      const id = normalizeId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID aspek tidak valid.'
        });
      }

      const currentResult = await db.query(
        `SELECT *
         FROM public.survey_aspects
         WHERE id = $1`,
        [id]
      );

      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aspek survei tidak ditemukan.'
        });
      }

      const current = currentResult.rows[0];
      const body = req.body || {};

      const label = body.label === undefined
        ? current.label
        : body.label;

      const englishLabel = body.englishLabel === undefined
        ? current.english_label
        : optionalText(body.englishLabel);

      const description = body.description === undefined
        ? current.description
        : optionalText(body.description);

      const displayOrder = body.displayOrder === undefined
        ? current.display_order
        : Number(body.displayOrder);

      const isActive = body.isActive === undefined
        ? current.is_active
        : body.isActive;

      if (typeof label !== 'string' || !label.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nama aspek wajib diisi.'
        });
      }

      if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        return res.status(400).json({
          success: false,
          message: 'Urutan aspek harus berupa bilangan bulat minimal 0.'
        });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Status aktif aspek tidak valid.'
        });
      }

      const result = await db.query(
        `UPDATE public.survey_aspects
         SET
           label = $1,
           english_label = $2,
           description = $3,
           display_order = $4,
           is_active = $5,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING
           id,
           aspect_key AS "aspectKey",
           label,
           english_label AS "englishLabel",
           description,
           display_order AS "displayOrder",
           is_active AS "isActive"`,
        [
          label.trim(),
          englishLabel,
          description,
          displayOrder,
          isActive,
          id
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Aspek survei berhasil diperbarui.',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error memperbarui aspek:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui aspek survei.'
      });
    }
  },

  // ======================================
  // 5. HAPUS ASPEK YANG BELUM DIGUNAKAN
  // ======================================
  deleteAspect: async (req, res) => {
    try {
      const id = normalizeId(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID aspek tidak valid.'
        });
      }

      const result = await db.query(
        `DELETE FROM public.survey_aspects a
         WHERE a.id = $1
           AND NOT EXISTS (
             SELECT 1
             FROM public.survey_response_details d
             WHERE d.aspect_id = a.id
           )
         RETURNING a.id`,
        [id]
      );

      if (result.rowCount === 0) {
        const exists = await db.query(
          `SELECT id
           FROM public.survey_aspects
           WHERE id = $1`,
          [id]
        );

        if (exists.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Aspek survei tidak ditemukan.'
          });
        }

        return res.status(409).json({
          success: false,
          message: 'Aspek sudah memiliki tanggapan. Nonaktifkan aspek agar riwayat penilaian tetap terjaga.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Aspek survei berhasil dihapus.'
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          success: false,
          message: 'Aspek sudah digunakan dalam tanggapan. Nonaktifkan aspek, jangan hapus permanen.'
        });
      }

      console.error('Error menghapus aspek:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus aspek survei.'
      });
    }
  },

  // ======================================
  // 6. KIRIM SURVEI MAHASISWA
  // ======================================
  submitSurvey: async (req, res) => {
    let client;

    try {
      client = await db.connect();
      const { ratings, comment } = req.body || {};

      if (!Array.isArray(ratings)) {
        return res.status(400).json({
          success: false,
          message: 'Format penilaian survei tidak valid.'
        });
      }

      const surveyComment = typeof comment === 'string'
        ? comment.trim()
        : '';

      await client.query('BEGIN');

      // Mengunci aspek aktif selama proses penyimpanan.
      const activeResult = await client.query(
        `SELECT
          id,
          aspect_key,
          label
         FROM public.survey_aspects
         WHERE is_active = TRUE
         ORDER BY display_order ASC, id ASC
         FOR SHARE`
      );

      const activeAspects = activeResult.rows;

      if (activeAspects.length === 0) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          success: false,
          message: 'Survei belum tersedia karena belum ada aspek aktif.'
        });
      }

      if (ratings.length !== activeAspects.length) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message: 'Semua aspek penilaian yang aktif wajib diisi.'
        });
      }

      const ratingMap = new Map();

      for (const item of ratings) {
        const aspectId = normalizeId(item?.aspectId);
        const rating = normalizeRating(item?.rating);

        if (!aspectId || rating === null || ratingMap.has(aspectId)) {
          await client.query('ROLLBACK');

          return res.status(400).json({
            success: false,
            message: 'Terdapat aspek atau nilai penilaian yang tidak valid.'
          });
        }

        ratingMap.set(aspectId, rating);
      }

      for (const aspect of activeAspects) {
        if (!ratingMap.has(Number(aspect.id))) {
          await client.query('ROLLBACK');

          return res.status(400).json({
            success: false,
            message: `Penilaian aspek ${aspect.label} belum diisi.`
          });
        }
      }

      const surveyResult = await client.query(
        `INSERT INTO public.surveys (comment)
         VALUES ($1)
         RETURNING id`,
        [surveyComment || null]
      );

      const surveyId = surveyResult.rows[0].id;

      for (const aspect of activeAspects) {
        await client.query(
          `INSERT INTO public.survey_response_details (
            survey_id,
            aspect_id,
            aspect_key_snapshot,
            aspect_label_snapshot,
            rating
          )
          VALUES ($1, $2, $3, $4, $5)`,
          [
            surveyId,
            aspect.id,
            aspect.aspect_key,
            aspect.label,
            ratingMap.get(Number(aspect.id))
          ]
        );
      }

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'Survei berhasil dikirim. Terima kasih atas penilaian Anda!',
        surveyId
      });
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback survei gagal:', rollbackError.message);
        }
      }

      console.error('Error submit survei:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server. Survei belum berhasil dikirim.'
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  // ======================================
  // 7. REKAP SURVEI ADMIN
  // ======================================
  getSurveySummary: async (req, res) => {
    try {
      const { aspects, responses } = await getSurveyData();

      const averages = {};
      const distribution = {};

      aspects.forEach((aspect) => {
        averages[aspect.aspect_key] = 0;

        distribution[aspect.aspect_key] = {
          'Sangat Baik': 0,
          'Baik': 0,
          'Kurang Baik': 0,
          'Tidak Baik': 0
        };
      });

      let totalRatings = 0;
      let totalScore = 0;

      const aspectTotals = {};

      aspects.forEach((aspect) => {
        aspectTotals[aspect.aspect_key] = {
          total: 0,
          count: 0
        };
      });

      responses.forEach((response) => {
        response.aspects.forEach((item) => {
          const key = item.aspectKey;
          const label = ratingLabels[item.rating];

          if (!aspectTotals[key]) {
            aspectTotals[key] = { total: 0, count: 0 };
          }

          if (!distribution[key]) {
            distribution[key] = {
              'Sangat Baik': 0,
              'Baik': 0,
              'Kurang Baik': 0,
              'Tidak Baik': 0
            };
          }

          aspectTotals[key].total += item.rating;
          aspectTotals[key].count += 1;
          totalRatings += 1;
          totalScore += item.rating;

          if (label) {
            distribution[key][label] += 1;
          }
        });
      });

      Object.keys(aspectTotals).forEach((key) => {
        const item = aspectTotals[key];

        averages[key] = item.count
          ? Number((item.total / item.count).toFixed(2))
          : 0;
      });

      const aspectSummaries = aspects.map((aspect) => ({
        id: Number(aspect.id),
        aspectKey: aspect.aspect_key,
        label: aspect.label,
        englishLabel: aspect.english_label,
        description: aspect.description,
        displayOrder: aspect.display_order,
        isActive: aspect.is_active,
        responseCount: aspectTotals[aspect.aspect_key]?.count || 0,
        average: averages[aspect.aspect_key] || 0,
        distribution: distribution[aspect.aspect_key]
      }));

      return res.status(200).json({
        success: true,
        message: 'Data survei berhasil diambil.',
        data: responses,
        aspects: aspectSummaries,
        summary: {
          totalResponses: responses.length,
          totalRatings,
          averages,
          overallAverage: totalRatings
            ? Number((totalScore / totalRatings).toFixed(2))
            : 0
        },
        distribution,
        ratingLabels
      });
    } catch (error) {
      console.error('Error mengambil rekap survei:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data survei.'
      });
    }
  },

  // ======================================
  // 8. HAPUS TANGGAPAN SURVEI
  // DETAIL IKUT TERHAPUS MELALUI FK CASCADE
  // ======================================
  deleteSurveys: async (req, res) => {
    try {
      const { ids } = req.body || {};

      if (
        !Array.isArray(ids) ||
        ids.length === 0 ||
        !ids.every((id) => normalizeId(id) !== null)
      ) {
        return res.status(400).json({
          success: false,
          message: 'ID tanggapan survei tidak valid.'
        });
      }

      const uniqueIds = [...new Set(ids.map(Number))];

      const result = await db.query(
        `DELETE FROM public.surveys
         WHERE id = ANY($1::int[])`,
        [uniqueIds]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tanggapan survei tidak ditemukan.'
        });
      }

      return res.status(200).json({
        success: true,
        message: `${result.rowCount} tanggapan survei berhasil dihapus.`,
        deletedCount: result.rowCount
      });
    } catch (error) {
      console.error('Error menghapus tanggapan survei:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus tanggapan survei.'
      });
    }
  },

  // ======================================
  // 9. EKSPOR SURVEI KE EXCEL
  // ======================================
  exportSurveyExcel: async (req, res) => {
    try {
      const { aspects, responses } = await getSurveyData();

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'UPA Bahasa POLNES';
      workbook.subject = 'Rekap Hasil Survei';
      workbook.title = 'Rekap Survei UPA Bahasa';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Hasil Survei');

      const columns = [
        { header: 'No', key: 'no', width: 8 },
        { header: 'Tanggal Pengisian', key: 'created_at', width: 22 }
      ];

      aspects.forEach((aspect) => {
        columns.push({
          header: aspect.label,
          key: `aspect_${aspect.id}`,
          width: 20
        });
      });

      columns.push({
        header: 'Komentar / Saran',
        key: 'comment',
        width: 40
      });

      worksheet.columns = columns;

      responses.forEach((response, index) => {
        const row = {
          no: index + 1,
          created_at: response.created_at
            ? new Date(response.created_at).toLocaleString('id-ID', {
                timeZone: 'Asia/Makassar'
              })
            : '-',
          comment: response.comment || '-'
        };

        aspects.forEach((aspect) => {
          const rating = response.aspects.find(
            (item) => item.aspectId === Number(aspect.id)
          );

          row[`aspect_${aspect.id}`] = rating
            ? rating.ratingLabel
            : '-';
        });

        worksheet.addRow(row);
      });

      const header = worksheet.getRow(1);

      header.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };

      header.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0A3D2E' }
      };

      header.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columnCount }
      };

      worksheet.views = [
        { state: 'frozen', ySplit: 1 }
      ];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.alignment = {
            vertical: 'middle',
            wrapText: true
          };
        }
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Rekap_Survei_UPA_Bahasa.xlsx"'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error ekspor survei:', error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Gagal mengekspor data survei ke Excel.'
        });
      }
    }
  }
};

module.exports = SurveyController;
