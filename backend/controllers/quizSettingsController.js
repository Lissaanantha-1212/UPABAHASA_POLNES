const db = require('../config/db.pg');

exports.getSettings = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        id,
        category,
        level,
        min_questions,
        max_questions
       FROM public.quiz_settings
       ORDER BY
         CASE category
           WHEN 'listening' THEN 1
           WHEN 'reading' THEN 2
           WHEN 'structure' THEN 3
           ELSE 4
         END,
         CASE level
           WHEN 'singkat' THEN 1
           WHEN 'sedang' THEN 2
           WHEN 'panjang' THEN 3
           ELSE 4
         END`
    );

    return res.status(200).json({
      success: true,
      message: 'Pengaturan Kuis berhasil diambil.',
      data: result.rows
    });
  } catch (error) {
    console.error('Get Quiz Settings Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil pengaturan Kuis.'
    });
  }
};
