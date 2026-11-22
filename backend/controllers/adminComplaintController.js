const db = require('../config/db.pg');

const {
  getComplaintAttachmentUrl,
  removeComplaintStorageIfUnreferenced
} = require('../services/complaintStorageService');

// ==========================================
// HELPER VALIDASI ID
// ==========================================

const isValidId = (id) => {
  const value = Number(id);

  return (
    /^\d+$/.test(String(id)) &&
    Number.isSafeInteger(value) &&
    value > 0
  );
};

// ==========================================
// HELPER ROLLBACK AMAN
// ==========================================

const rollbackQuietly = async (connection) => {
  if (!connection) return;

  try {
    await connection.query('ROLLBACK');
  } catch (error) {
    console.error('Rollback Error:', error);
  }
};

// ==========================================
// HELPER SERIALISASI LAMPIRAN
// ==========================================

const serializeComplaintAttachments = async (complaint) => {
  const [attachment, additional_attachment] = await Promise.all([
    getComplaintAttachmentUrl(complaint.attachment),
    getComplaintAttachmentUrl(complaint.additional_attachment)
  ]);

  return {
    ...complaint,
    attachment,
    additional_attachment
  };
};

const AdminComplaintController = {

  // ==========================================
  // 1. ADMIN MELIHAT SEMUA PENGADUAN
  // ==========================================

  getAllComplaints: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
          id,
          ticket_number,
          name,
          nim,
          program_studi,
          whatsapp,
          category,
          layanan,
          description,
          attachment,
          additional_attachment,
          status,
          admin_note,
          resolution_note,
          created_at,
          updated_at
        FROM public.complaints
        ORDER BY created_at DESC`
      );

      const complaints = await Promise.all(
        result.rows.map(serializeComplaintAttachments)
      );

      return res.status(200).json({
        message: 'Data pengaduan berhasil diambil.',
        data: complaints
      });

    } catch (error) {
      console.error('Get All Complaints Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat mengambil data pengaduan.'
      });
    }
  },

  // ==========================================
  // 2. ADMIN MELIHAT DETAIL PENGADUAN
  // ==========================================

  getComplaintDetail: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'ID pengaduan tidak valid.'
        });
      }

      const complaintResult = await db.query(
        `SELECT
          id,
          ticket_number,
          name,
          nim,
          program_studi,
          whatsapp,
          category,
          layanan,
          description,
          attachment,
          additional_attachment,
          status,
          admin_note,
          resolution_note,
          created_at,
          updated_at
        FROM public.complaints
        WHERE id = $1`,
        [Number(id)]
      );

      if (complaintResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Data pengaduan tidak ditemukan.'
        });
      }

      const historyResult = await db.query(
        `SELECT
          id,
          old_status,
          new_status,
          admin_note,
          student_note,
          created_at
        FROM public.complaint_histories
        WHERE complaint_id = $1
        ORDER BY created_at ASC, id ASC`,
        [Number(id)]
      );

      const complaint = await serializeComplaintAttachments(
        complaintResult.rows[0]
      );

      return res.status(200).json({
        message: 'Detail pengaduan berhasil diambil.',
        data: {
          ...complaint,
          histories: historyResult.rows
        }
      });

    } catch (error) {
      console.error('Get Complaint Detail Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat mengambil detail pengaduan.'
      });
    }
  },

  // ==========================================
  // 3. ADMIN MENGUBAH STATUS PENGADUAN
  // ==========================================

  updateComplaintStatus: async (req, res) => {
    let connection;
    let committed = false;

    try {
      const { id } = req.params;

      const {
        status,
        admin_note,
        resolution_note
      } = req.body || {};

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'ID pengaduan tidak valid.'
        });
      }

      const allowedStatuses = [
        'menunggu',
        'diproses',
        'perlu_dilengkapi',
        'selesai'
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Status pengaduan tidak valid.'
        });
      }

      if (
        admin_note !== undefined &&
        typeof admin_note !== 'string'
      ) {
        return res.status(400).json({
          message: 'Catatan Admin harus berupa teks.'
        });
      }

      if (
        resolution_note !== undefined &&
        typeof resolution_note !== 'string'
      ) {
        return res.status(400).json({
          message: 'Catatan penyelesaian harus berupa teks.'
        });
      }

      const adminNote = admin_note?.trim() || '';
      const resolutionNote = resolution_note?.trim() || '';

      if (
        status === 'perlu_dilengkapi' &&
        !adminNote
      ) {
        return res.status(400).json({
          message: 'Catatan Admin wajib diisi ketika meminta informasi tambahan.'
        });
      }

      if (
        status === 'selesai' &&
        !resolutionNote
      ) {
        return res.status(400).json({
          message: 'Catatan penyelesaian wajib diisi.'
        });
      }

      connection = await db.connect();

      await connection.query('BEGIN');

      const complaintResult = await connection.query(
        `SELECT
          id,
          status,
          admin_note,
          resolution_note
        FROM public.complaints
        WHERE id = $1
        FOR UPDATE`,
        [Number(id)]
      );

      if (complaintResult.rows.length === 0) {
        await rollbackQuietly(connection);

        return res.status(404).json({
          message: 'Data pengaduan tidak ditemukan.'
        });
      }

      const complaint = complaintResult.rows[0];
      const oldStatus = complaint.status;

      const finalAdminNote =
        adminNote || complaint.admin_note || null;

      const finalResolutionNote =
        status === 'selesai'
          ? resolutionNote
          : null;

      await connection.query(
        `UPDATE public.complaints
        SET
          status = $1,
          admin_note = $2,
          resolution_note = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4`,
        [
          status,
          finalAdminNote,
          finalResolutionNote,
          Number(id)
        ]
      );

      const historyNote =
        status === 'selesai'
          ? finalResolutionNote
          : finalAdminNote;

      await connection.query(
        `INSERT INTO public.complaint_histories
        (
          complaint_id,
          old_status,
          new_status,
          admin_note,
          student_note
        )
        VALUES ($1, $2, $3, $4, $5)`,
        [
          Number(id),
          oldStatus,
          status,
          historyNote,
          null
        ]
      );

      await connection.query('COMMIT');
      committed = true;

      return res.status(200).json({
        message: 'Status pengaduan berhasil diperbarui.',
        data: {
          id: Number(id),
          old_status: oldStatus,
          status,
          admin_note: finalAdminNote,
          resolution_note: finalResolutionNote
        }
      });

    } catch (error) {
      if (connection && !committed) {
        await rollbackQuietly(connection);
      }

      console.error('Update Complaint Status Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat memperbarui status pengaduan.'
      });

    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // ==========================================
  // 4. ADMIN MENGHAPUS PENGADUAN YANG SELESAI
  // ==========================================

  deleteComplaint: async (req, res) => {
    let connection;
    let committed = false;
    let attachmentPaths = [];

    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        return res.status(400).json({
          message: 'ID pengaduan tidak valid.'
        });
      }

      connection = await db.connect();

      await connection.query('BEGIN');

      const complaintResult = await connection.query(
        `SELECT
          id,
          status,
          attachment,
          additional_attachment
        FROM public.complaints
        WHERE id = $1
        FOR UPDATE`,
        [Number(id)]
      );

      if (complaintResult.rows.length === 0) {
        await rollbackQuietly(connection);

        return res.status(404).json({
          message: 'Data pengaduan tidak ditemukan.'
        });
      }

      const complaint = complaintResult.rows[0];

      if (complaint.status !== 'selesai') {
        await rollbackQuietly(connection);

        return res.status(400).json({
          message: 'Pengaduan hanya dapat dihapus jika statusnya sudah Selesai.'
        });
      }

      attachmentPaths = [
        complaint.attachment,
        complaint.additional_attachment
      ].filter(
        (value, index, array) =>
          typeof value === 'string' &&
          value &&
          array.indexOf(value) === index
      );

      await connection.query(
        `DELETE FROM public.complaint_histories
        WHERE complaint_id = $1`,
        [Number(id)]
      );

      const deleteResult = await connection.query(
        `DELETE FROM public.complaints
        WHERE id = $1
          AND status = 'selesai'
        RETURNING id`,
        [Number(id)]
      );

      if (deleteResult.rowCount !== 1) {
        throw new Error('Pengaduan gagal dihapus.');
      }

      await connection.query('COMMIT');
      committed = true;

      // Hapus objek Storage hanya setelah transaksi berhasil.
      // Helper memeriksa apakah objek masih direferensikan.
      for (const objectPath of attachmentPaths) {
        await removeComplaintStorageIfUnreferenced(objectPath);
      }

      return res.status(200).json({
        message: 'Pengaduan berhasil dihapus.',
        data: {
          id: Number(id)
        }
      });

    } catch (error) {
      if (connection && !committed) {
        await rollbackQuietly(connection);
      }

      console.error('Delete Complaint Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat menghapus pengaduan.'
      });

    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

};

module.exports = AdminComplaintController;
