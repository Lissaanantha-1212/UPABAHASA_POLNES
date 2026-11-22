const db = require('../config/db.pg');

// Mengubah JSON dari database menjadi array
const parseArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Mengambil tanggal hari ini berdasarkan zona waktu WITA
const getTodayWITA = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
};

// Mengubah tanggal database menjadi format YYYY-MM-DD berdasarkan WITA
const getDateKeyWITA = (value) => {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
};

// Status program dihitung otomatis berdasarkan periode pendaftaran
const getProgramStatus = (start, end) => {
  const startDate = getDateKeyWITA(start);
  const endDate = getDateKeyWITA(end);

  if (!startDate || !endDate) return 'upcoming';

  const today = getTodayWITA();

  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'closed';

  return 'open';
};

// Format data program untuk frontend
const formatProgram = (row) => {
  const { target, is_featured, status, is_manually_closed, ...program } = row;

  return {
    ...program,
    benefits: parseArray(row.benefits),
    requirements: parseArray(row.requirements),
    registration_flow: parseArray(row.registration_flow),
    status: getProgramStatus(row.reg_start, row.reg_end)
  };
};

const NonTestProgramController = {

  // GET seluruh program non-tes
  getAllPrograms: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT *
        FROM public.non_test_programs
        ORDER BY id ASC
      `);

      return res.status(200).json({
        success: true,
        message: 'Data program berhasil diambil.',
        data: result.rows.map(formatProgram)
      });

    } catch (error) {
      console.error('Get Non-Test Programs Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data program.'
      });
    }
  },

  // GET detail satu program
  getProgramById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID program tidak valid.'
        });
      }

      const result = await db.query(
        'SELECT * FROM public.non_test_programs WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Program tidak ditemukan.'
        });
      }

      return res.status(200).json({
        success: true,
        data: formatProgram(result.rows[0])
      });

    } catch (error) {
      console.error('Get Non-Test Program Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail program.'
      });
    }
  },

  // PUT memperbarui informasi program
  updateProgram: async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id) || Number(id) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID program tidak valid.'
        });
      }

      const existingResult = await db.query(
        'SELECT * FROM public.non_test_programs WHERE id = $1',
        [id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Program tidak ditemukan.'
        });
      }

      const {
        description,
        benefits,
        requirements,
        registration_flow,
        reg_start,
        reg_end
      } = req.body;

      if (
        typeof description !== 'string' ||
        !description.trim() ||
        !Array.isArray(benefits) ||
        !Array.isArray(requirements) ||
        !Array.isArray(registration_flow)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Format informasi program tidak valid.'
        });
      }

      const cleanBenefits = benefits.map(item =>
        typeof item === 'string' ? item.trim() : ''
      ).filter(Boolean);

      const cleanRequirements = requirements.map(item =>
        typeof item === 'string' ? item.trim() : ''
      ).filter(Boolean);

      const cleanRegistrationFlow = registration_flow.map(item =>
        typeof item === 'string' ? item.trim() : ''
      ).filter(Boolean);

      const validDate = (value) => {
        if (value === null || value === '') return null;

        if (
          typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
          return undefined;
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        return !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
          ? value
          : undefined;
      };

      const startDate = validDate(reg_start);
      const endDate = validDate(reg_end);

      if (startDate === undefined || endDate === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Format tanggal pendaftaran tidak valid.'
        });
      }

      if (Boolean(startDate) !== Boolean(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal mulai dan tanggal akhir harus diisi bersama, atau dikosongkan bersama.'
        });
      }

      if (startDate && endDate && startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'Tanggal akhir tidak boleh sebelum tanggal mulai.'
        });
      }

      await db.query(
        `UPDATE public.non_test_programs SET
          description = $1,
          benefits = $2,
          requirements = $3,
          registration_flow = $4,
          reg_start = $5,
          reg_end = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7`,
        [
          description.trim(),
          JSON.stringify(cleanBenefits),
          JSON.stringify(cleanRequirements),
          JSON.stringify(cleanRegistrationFlow),
          startDate,
          endDate,
          id
        ]
      );

      const updatedResult = await db.query(
        'SELECT * FROM public.non_test_programs WHERE id = $1',
        [id]
      );

      return res.status(200).json({
        success: true,
        message: 'Informasi program berhasil diperbarui.',
        data: formatProgram(updatedResult.rows[0])
      });

    } catch (error) {
      console.error('Update Non-Test Program Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui informasi program.'
      });
    }
  }
};

module.exports = NonTestProgramController;
