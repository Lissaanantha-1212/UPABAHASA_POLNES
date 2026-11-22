const db = require('../config/db.pg');

const MajorController = {
  getAllMajors: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT id, jurusan, jenjang, prodi
         FROM public.majors
         ORDER BY jurusan ASC, prodi ASC`
      );

      const formattedMajors = result.rows.map(row => ({
        id: row.id,
        label: `${row.jenjang} ${row.prodi} (${row.jurusan})`,
        value: row.id
      }));

      res.status(200).json({
        message: 'Data program studi berhasil diambil',
        data: formattedMajors
      });
    } catch (error) {
      console.error('Error fetching majors:', error);

      res.status(500).json({
        message: 'Terjadi kesalahan pada server',
        error: error.message
      });
    }
  }
};

module.exports = MajorController;
