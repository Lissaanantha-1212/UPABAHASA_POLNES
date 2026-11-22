const db = require('../config/db.pg');
const crypto = require('crypto');

const {
  uploadComplaintFile,
  getComplaintAttachmentUrl,
  removeComplaintStorageIfUnreferenced
} = require('../services/complaintStorageService');

// ==========================================
// HELPER - ROLLBACK AMAN
// ==========================================

const rollbackQuietly = async (connection) => {
  if (!connection) return;

  try {
    await connection.query('ROLLBACK');
  } catch (error) {
    console.error('Rollback Error:', error);
  }
};

const ComplaintController = {

  // ==========================================
  // 1. MAHASISWA MENGIRIM PENGADUAN
  // ==========================================

  createComplaint: async (req, res) => {
    let connection;
    let committed = false;
    let uploadedObjectPath = null;

    try {
      const {
        name,
        nim,
        program_studi,
        whatsapp,
        category,
        layanan,
        description
      } = req.body || {};

      if (
        typeof name !== 'string' || !name.trim() ||
        typeof nim !== 'string' || !nim.trim() ||
        !program_studi ||
        !category ||
        typeof description !== 'string' ||
        !description.trim()
      ) {
        return res.status(400).json({
          message: 'Data pengaduan belum lengkap.'
        });
      }

      if (
        whatsapp !== undefined &&
        whatsapp !== null &&
        typeof whatsapp !== 'string'
      ) {
        return res.status(400).json({
          message: 'Nomor WhatsApp tidak valid.'
        });
      }

      const whatsappNumber = whatsapp?.trim() || null;

      // Upload ke bucket private jika mahasiswa menyertakan lampiran.
      if (req.file) {
        uploadedObjectPath = await uploadComplaintFile(
          req.file,
          'complaints'
        );
      }

      connection = await db.connect();
      await connection.query('BEGIN');

      let insertResult;
      let ticketNumber;
      let accessCode;

      // Coba ulang jika nomor tiket kebetulan sudah digunakan.
      for (let attempt = 0; attempt < 5; attempt++) {
        ticketNumber =
          `ADU-${new Date().getFullYear()}-${crypto.randomInt(1000, 10000)}`;

        accessCode = crypto
          .randomBytes(3)
          .toString('hex')
          .toUpperCase();

        await connection.query('SAVEPOINT ticket_insert');

        try {
          insertResult = await connection.query(
            `INSERT INTO public.complaints
            (
              ticket_number,
              access_code,
              name,
              nim,
              program_studi,
              whatsapp,
              category,
              layanan,
              description,
              attachment,
              status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id`,
            [
              ticketNumber,
              accessCode,
              name.trim(),
              nim.trim(),
              program_studi,
              whatsappNumber,
              category,
              layanan || null,
              description.trim(),
              uploadedObjectPath,
              'menunggu'
            ]
          );

          await connection.query('RELEASE SAVEPOINT ticket_insert');
          break;

        } catch (error) {
          await connection.query('ROLLBACK TO SAVEPOINT ticket_insert');
          await connection.query('RELEASE SAVEPOINT ticket_insert');

          if (error.code === '23505' && attempt < 4) {
            continue;
          }

          throw error;
        }
      }

      if (!insertResult?.rows?.length) {
        throw new Error('Gagal membuat nomor tiket pengaduan.');
      }

      const complaintId = insertResult.rows[0].id;

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
          complaintId,
          null,
          'menunggu',
          null,
          null
        ]
      );

      const attachmentUrl = uploadedObjectPath
        ? await getComplaintAttachmentUrl(uploadedObjectPath)
        : null;

      await connection.query('COMMIT');
      committed = true;

      return res.status(201).json({
        message: 'Pengaduan berhasil dikirim!',
        data: {
          id: complaintId,
          ticket_number: ticketNumber,
          access_code: accessCode,
          name: name.trim(),
          whatsapp: whatsappNumber,
          attachment: attachmentUrl
        }
      });

    } catch (error) {
      if (connection && !committed) {
        await rollbackQuietly(connection);
      }

      if (!committed && uploadedObjectPath) {
        await removeComplaintStorageIfUnreferenced(uploadedObjectPath);
      }

      console.error('Create Complaint Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat mengirim pengaduan.'
      });

    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // ==========================================
  // 2. MAHASISWA MELACAK PENGADUAN
  // ==========================================

  trackComplaint: async (req, res) => {
    try {
      const {
        ticket_number,
        access_code
      } = req.body || {};

      if (
        typeof ticket_number !== 'string' ||
        !ticket_number.trim() ||
        typeof access_code !== 'string' ||
        !access_code.trim()
      ) {
        return res.status(400).json({
          message: 'Nomor tiket dan kode akses wajib diisi.'
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
        WHERE ticket_number = $1
          AND access_code = $2`,
        [
          ticket_number.trim(),
          access_code.trim().toUpperCase()
        ]
      );

      if (complaintResult.rows.length === 0) {
        return res.status(404).json({
          message: 'Nomor tiket atau kode akses tidak ditemukan.'
        });
      }

      const complaint = complaintResult.rows[0];

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
        [complaint.id]
      );

      const formattedHistories = historyResult.rows.map((history) => {
        let sender = 'sistem';

        if (history.student_note) {
          sender = 'mahasiswa';
        } else if (history.admin_note) {
          sender = 'admin';
        }

        return {
          id: history.id,
          old_status: history.old_status,
          status: history.new_status,
          sender,
          admin_note: history.admin_note || '',
          student_note: history.student_note || '',
          note:
            history.student_note ||
            history.admin_note ||
            'Pengaduan berhasil dikirim dan menunggu verifikasi Admin.',
          date: history.created_at
        };
      });

      // Signed URL hanya dibuat setelah tiket dan kode akses tervalidasi.
      const [attachmentUrl, additionalAttachmentUrl] = await Promise.all([
        getComplaintAttachmentUrl(complaint.attachment),
        getComplaintAttachmentUrl(complaint.additional_attachment)
      ]);

      return res.status(200).json({
        message: 'Data pengaduan berhasil ditemukan.',
        data: {
          ...complaint,
          attachment: attachmentUrl,
          additional_attachment: additionalAttachmentUrl,
          current_status: complaint.status,
          histories: formattedHistories
        }
      });

    } catch (error) {
      console.error('Track Complaint Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat melacak pengaduan.'
      });
    }
  },

  // ==========================================
  // 3. MAHASISWA MENGIRIM INFORMASI TAMBAHAN
  // ==========================================

  submitAdditionalInfo: async (req, res) => {
    let connection;
    let committed = false;
    let uploadedObjectPath = null;
    let previousAdditionalAttachment = null;

    try {
      const {
        ticket_number,
        access_code,
        student_note
      } = req.body || {};

      if (
        typeof ticket_number !== 'string' ||
        !ticket_number.trim() ||
        typeof access_code !== 'string' ||
        !access_code.trim() ||
        typeof student_note !== 'string' ||
        !student_note.trim()
      ) {
        return res.status(400).json({
          message: 'Nomor tiket, kode akses, dan informasi tambahan wajib diisi.'
        });
      }

      connection = await db.connect();
      await connection.query('BEGIN');

      const complaintResult = await connection.query(
        `SELECT id, status, additional_attachment
         FROM public.complaints
         WHERE ticket_number = $1
           AND access_code = $2
         FOR UPDATE`,
        [
          ticket_number.trim(),
          access_code.trim().toUpperCase()
        ]
      );

      if (complaintResult.rows.length === 0) {
        await rollbackQuietly(connection);

        return res.status(404).json({
          message: 'Nomor tiket atau kode akses tidak ditemukan.'
        });
      }

      const complaint = complaintResult.rows[0];

      if (complaint.status !== 'perlu_dilengkapi') {
        await rollbackQuietly(connection);

        return res.status(400).json({
          message: 'Pengaduan tidak sedang menunggu informasi tambahan.'
        });
      }

      previousAdditionalAttachment = complaint.additional_attachment;

      // Upload hanya setelah tiket, kode akses, dan status tervalidasi.
      if (req.file) {
        uploadedObjectPath = await uploadComplaintFile(
          req.file,
          'additional'
        );
      }

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
          complaint.id,
          'perlu_dilengkapi',
          'diproses',
          null,
          student_note.trim()
        ]
      );

      await connection.query(
        `UPDATE public.complaints
         SET status = $1,
             additional_attachment = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [
          'diproses',
          uploadedObjectPath,
          complaint.id
        ]
      );

      const additionalAttachmentUrl = uploadedObjectPath
        ? await getComplaintAttachmentUrl(uploadedObjectPath)
        : null;

      await connection.query('COMMIT');
      committed = true;

      // Bersihkan lampiran lama hanya jika sudah tidak direferensikan.
      if (
        previousAdditionalAttachment &&
        previousAdditionalAttachment !== uploadedObjectPath
      ) {
        await removeComplaintStorageIfUnreferenced(
          previousAdditionalAttachment
        );
      }

      return res.status(200).json({
        message: 'Informasi tambahan berhasil dikirim. Pengaduan kembali diproses.',
        data: {
          ticket_number: ticket_number.trim(),
          status: 'diproses',
          student_note: student_note.trim(),
          additional_attachment: additionalAttachmentUrl
        }
      });

    } catch (error) {
      if (connection && !committed) {
        await rollbackQuietly(connection);
      }

      if (!committed && uploadedObjectPath) {
        await removeComplaintStorageIfUnreferenced(uploadedObjectPath);
      }

      console.error('Submit Additional Info Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan saat mengirim informasi tambahan.'
      });

    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

};

module.exports = ComplaintController;

