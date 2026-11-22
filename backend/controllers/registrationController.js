const db = require('../config/db.pg');

const MAX_TRANSACTION_ATTEMPTS = 3;

const getTodayWITA = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

const RegistrationController = {

  // ==========================================
  // 1. MAHASISWA MENDAFTAR PROGRAM NON-TES
  // ==========================================
  createRegistration: async (req, res) => {
    try {
      const {
        program_id,
        major_id,
        name,
        nim,
        class: studentClass,
        semester,
        phone,
      } = req.body;

      const programId = Number(program_id);
      const majorId = Number(major_id);
      const semesterNumber = Number(semester);

      const studentName = String(name || '').trim();
      const studentNim = String(nim || '').trim();
      const studentClassValue = String(studentClass || '').trim();
      const studentPhone = String(phone || '').trim();

      if (
        !Number.isInteger(programId) || programId <= 0 ||
        !Number.isInteger(majorId) || majorId <= 0 ||
        !studentName ||
        !studentNim ||
        !studentClassValue ||
        !Number.isInteger(semesterNumber) ||
        semesterNumber < 1 ||
        semesterNumber > 8 ||
        !studentPhone
      ) {
        return res.status(400).json({
          success: false,
          message: 'Data pendaftaran belum lengkap atau tidak valid.',
        });
      }

      if (
        studentName.length > 100 ||
        studentNim.length > 20 ||
        studentClassValue.length > 20 ||
        studentPhone.length > 20
      ) {
        return res.status(400).json({
          success: false,
          message: 'Beberapa data melebihi batas karakter yang diizinkan.',
        });
      }

      // Periksa program dan periode pendaftaran
      const programResult = await db.query(
        `SELECT
           id,
           TO_CHAR(reg_start, 'YYYY-MM-DD') AS reg_start,
           TO_CHAR(reg_end, 'YYYY-MM-DD') AS reg_end
         FROM public.non_test_programs
         WHERE id = $1
         LIMIT 1`,
        [programId]
      );

      if (programResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Program yang dipilih tidak ditemukan.',
        });
      }

      const program = programResult.rows[0];
      const today = getTodayWITA();

      const isRegistrationOpen =
        program.reg_start &&
        program.reg_end &&
        today >= program.reg_start &&
        today <= program.reg_end;

      if (!isRegistrationOpen) {
        return res.status(409).json({
          success: false,
          message: 'Pendaftaran program ini sedang tidak dibuka.',
        });
      }

      // Periksa program studi
      const majorResult = await db.query(
        `SELECT id
         FROM public.majors
         WHERE id = $1
         LIMIT 1`,
        [majorId]
      );

      if (majorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Program studi yang dipilih tidak ditemukan.',
        });
      }

      // ==========================================
      // TRANSAKSI DETEKSI DUPLIKAT NIM
      // ==========================================

      let registration = null;
      let possibleDuplicate = false;

      for (
        let attempt = 1;
        attempt <= MAX_TRANSACTION_ATTEMPTS;
        attempt++
      ) {
        const client = await db.connect();
        let transactionStarted = false;

        try {
          await client.query(
            'BEGIN ISOLATION LEVEL SERIALIZABLE'
          );

          transactionStarted = true;

          // Cari seluruh pendaftar dengan NIM sama
          // dalam program yang sama.
          const duplicateResult = await client.query(
            `SELECT id
             FROM public.registrations
             WHERE program_id = $1
               AND nim = $2
             ORDER BY id
             FOR UPDATE`,
            [programId, studentNim]
          );

          possibleDuplicate = duplicateResult.rows.length > 0;

          // Jika duplikat ditemukan, tandai seluruh
          // pendaftar lama yang memiliki NIM tersebut.
          if (possibleDuplicate) {
            await client.query(
              `UPDATE public.registrations
               SET
                 verification_status = 'perlu_verifikasi_nim',
                 verified_at = NULL,
                 verified_by = NULL,
                 verified_by_admin_id = NULL,
                 updated_at = CURRENT_TIMESTAMP
               WHERE program_id = $1
                 AND nim = $2`,
              [programId, studentNim]
            );
          }

          // Simpan pendaftar baru.
          const insertResult = await client.query(
            `INSERT INTO public.registrations
              (
                program_id,
                major_id,
                name,
                nim,
                class,
                semester,
                phone,
                verification_status,
                verified_at,
                verified_by
              )
             VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8,
                CASE
                  WHEN $9::boolean
                  THEN CURRENT_TIMESTAMP
                  ELSE NULL
                END,
                NULL
             )
             RETURNING id, verification_status, verified_at`,
            [
              programId,
              majorId,
              studentName,
              studentNim,
              studentClassValue,
              semesterNumber,
              studentPhone,
              possibleDuplicate
                ? 'perlu_verifikasi_nim'
                : 'terverifikasi',
              !possibleDuplicate,
            ]
          );

          await client.query('COMMIT');
          transactionStarted = false;

          registration = insertResult.rows[0];

          client.release();
          break;

        } catch (error) {
          if (transactionStarted) {
            try {
              await client.query('ROLLBACK');
            } catch (rollbackError) {
              console.error(
                'Registration Rollback Error:',
                rollbackError.message
              );
            }
          }

          client.release();

          // Retry jika terjadi konflik transaksi.
          if (
            ['40001', '40P01'].includes(error.code) &&
            attempt < MAX_TRANSACTION_ATTEMPTS
          ) {
            console.warn(
              `Konflik transaksi pendaftaran. Percobaan ulang ${attempt + 1}/${MAX_TRANSACTION_ATTEMPTS}.`
            );

            continue;
          }

          // Jika konflik tetap terjadi setelah retry.
          if (['40001', '40P01'].includes(error.code)) {
            console.error(
              'Registration Transaction Conflict:',
              error
            );

            return res.status(409).json({
              success: false,
              message:
                'Pendaftaran sedang mengalami proses bersamaan. Silakan coba kembali.',
            });
          }

          throw error;
        }
      }

      if (!registration) {
        return res.status(500).json({
          success: false,
          message: 'Pendaftaran belum berhasil disimpan.',
        });
      }

      return res.status(201).json({
        success: true,
        message: possibleDuplicate
          ? 'Pendaftaran berhasil disimpan. Data dengan NIM yang sama perlu diperiksa Admin.'
          : 'Pendaftaran berhasil dikirim.',
        data: {
          id: registration.id,
          possible_duplicate: possibleDuplicate,
          verification_status: registration.verification_status,
        },
      });

    } catch (error) {
      console.error('Error creating registration:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server saat menyimpan pendaftaran.',
      });
    }
  },

  // ==========================================
  // 2. ADMIN MELIHAT SELURUH PENDAFTAR
  // ==========================================
  getAllRegistrations: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
          r.id,
          r.program_id,
          r.major_id,
          r.name,
          r.nim,
          r.class,
          r.semester,
          r.phone,
          r.verification_status,
          r.verified_at,
          r.verified_by,
          r.created_at,
          r.updated_at,
          p.name AS program_name,
          m.jurusan,
          m.jenjang,
          m.prodi
        FROM public.registrations r
        INNER JOIN public.non_test_programs p
          ON r.program_id = p.id
        INNER JOIN public.majors m
          ON r.major_id = m.id
        ORDER BY r.created_at DESC, r.id DESC`
      );

      return res.status(200).json({
        success: true,
        message: 'Data pendaftar berhasil diambil.',
        data: result.rows,
      });

    } catch (error) {
      console.error('Get All Registrations Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data pendaftar.',
      });
    }
  },

  // ==========================================
  // 3. ADMIN MENGOREKSI NIM PENDAFTAR
  // ==========================================
  updateRegistrationNim: async (req, res) => {
    const registrationId = Number(req.params.id);
    const newNim = String(req.body.nim || '').trim();

    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID pendaftar tidak valid.',
      });
    }

    if (!newNim || newNim.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'NIM wajib diisi dan maksimal 20 karakter.',
      });
    }

    const isSupabaseAuth = req.user.authType === 'supabase';
    const verifiedBy = isSupabaseAuth ? null : String(req.user.id);
    const verifiedByAdminId = isSupabaseAuth ? req.user.adminProfileId : null;
    let client;

    try {
      for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
        client = await db.connect();
        let transactionStarted = false;

        try {
          await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
          transactionStarted = true;

          const currentResult = await client.query(
            `SELECT id, program_id
             FROM public.registrations
             WHERE id = $1
             FOR UPDATE`,
            [registrationId]
          );

          if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            client.release();
            client = null;

            return res.status(404).json({
              success: false,
              message: 'Data pendaftar tidak ditemukan.',
            });
          }

          const programId = currentResult.rows[0].program_id;

          await client.query(
            `UPDATE public.registrations
             SET nim = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [newNim, registrationId]
          );

          const duplicateResult = await client.query(
            `SELECT id
             FROM public.registrations
             WHERE program_id = $1
               AND nim = $2
             ORDER BY id
             FOR UPDATE`,
            [programId, newNim]
          );

          const isDuplicate = duplicateResult.rows.length > 1;

          if (isDuplicate) {
            await client.query(
              `UPDATE public.registrations
               SET verification_status = 'perlu_verifikasi_nim',
                   verified_at = NULL,
                   verified_by = NULL,
                   verified_by_admin_id = NULL,
                   updated_at = CURRENT_TIMESTAMP
               WHERE program_id = $1 AND nim = $2`,
              [programId, newNim]
            );
          } else {
            await client.query(
              `UPDATE public.registrations
               SET verification_status = 'terverifikasi',
                   verified_at = CURRENT_TIMESTAMP,
                   verified_by = CASE WHEN $1::boolean THEN NULL ELSE $2 END,
                   verified_by_admin_id = CASE WHEN $1::boolean THEN $3::uuid ELSE NULL END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [isSupabaseAuth, verifiedBy, verifiedByAdminId, registrationId]
            );
          }

          await client.query('COMMIT');
          transactionStarted = false;
          client.release();
          client = null;

          return res.status(200).json({
            success: true,
            message: isDuplicate
              ? 'NIM berhasil dikoreksi, tetapi masih ditemukan NIM yang sama dalam program ini. Data perlu diverifikasi.'
              : 'NIM berhasil dikoreksi dan pendaftar otomatis terverifikasi.',
            data: {
              id: registrationId,
              nim: newNim,
              verification_status: isDuplicate
                ? 'perlu_verifikasi_nim'
                : 'terverifikasi',
              possible_duplicate: isDuplicate,
            },
          });

        } catch (error) {
          if (transactionStarted) {
            try {
              await client.query('ROLLBACK');
            } catch (rollbackError) {
              console.error('Rollback koreksi NIM:', rollbackError.message);
            }
          }

          if (client) {
            client.release();
            client = null;
          }

          if (
            ['40001', '40P01'].includes(error.code) &&
            attempt < MAX_TRANSACTION_ATTEMPTS
          ) {
            continue;
          }

          if (['40001', '40P01'].includes(error.code)) {
            return res.status(409).json({
              success: false,
              message: 'Data sedang diproses bersamaan. Silakan coba kembali.',
            });
          }

          throw error;
        }
      }

      return res.status(409).json({
        success: false,
        message: 'Koreksi NIM belum berhasil. Silakan coba kembali.',
      });

    } catch (error) {
      console.error('Update Registration NIM Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengoreksi NIM.',
      });
    }
  },

  // ==========================================
  // 4. ADMIN MENGUBAH STATUS VERIFIKASI
  // ==========================================
  updateRegistrationVerification: async (req, res) => {
    const registrationId = Number(req.params.id);
    const status = String(req.body.verification_status || '').trim();

    const allowedStatuses = [
      'terverifikasi',
      'perlu_verifikasi_nim',
      'perlu_tindak_lanjut',
    ];

    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID pendaftar tidak valid.',
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status verifikasi tidak valid.',
      });
    }

    const isSupabaseAuth = req.user.authType === 'supabase';
    const verifiedBy = isSupabaseAuth ? null : String(req.user.id);
    const verifiedByAdminId = isSupabaseAuth ? req.user.adminProfileId : null;

    try {
      for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
        const client = await db.connect();
        let transactionStarted = false;

        try {
          await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
          transactionStarted = true;

          const currentResult = await client.query(
            `SELECT id, program_id, nim
             FROM public.registrations
             WHERE id = $1
             FOR UPDATE`,
            [registrationId]
          );

          if (currentResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            client.release();

            return res.status(404).json({
              success: false,
              message: 'Data pendaftar tidak ditemukan.',
            });
          }

          const current = currentResult.rows[0];

          // Verifikasi hanya boleh dilakukan jika NIM
          // tidak memiliki duplikat dalam program yang sama.
          if (status === 'terverifikasi') {
            const duplicateResult = await client.query(
              `SELECT id
               FROM public.registrations
               WHERE program_id = $1
                 AND nim = $2
               ORDER BY id
               FOR UPDATE`,
              [current.program_id, current.nim]
            );

            if (duplicateResult.rows.length > 1) {
              await client.query(
                `UPDATE public.registrations
                 SET verification_status = 'perlu_verifikasi_nim',
                     verified_at = NULL,
                     verified_by = NULL,
                     verified_by_admin_id = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE program_id = $1
                   AND nim = $2`,
                [current.program_id, current.nim]
              );

              await client.query('COMMIT');
              transactionStarted = false;
              client.release();

              return res.status(409).json({
                success: false,
                message: 'NIM masih digunakan oleh pendaftar lain dalam program yang sama. Seluruh data terkait ditandai perlu verifikasi.',
                data: {
                  verification_status: 'perlu_verifikasi_nim',
                  duplicate_count: duplicateResult.rows.length,
                },
              });
            }

            await client.query(
              `UPDATE public.registrations
               SET verification_status = $1,
                   verified_at = CURRENT_TIMESTAMP,
                   verified_by = CASE WHEN $2::boolean THEN NULL ELSE $3 END,
                   verified_by_admin_id = CASE WHEN $2::boolean THEN $4::uuid ELSE NULL END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $5`,
              [status, isSupabaseAuth, verifiedBy, verifiedByAdminId, registrationId]
            );

          } else {
            await client.query(
              `UPDATE public.registrations
               SET verification_status = $1,
                   verified_at = NULL,
                   verified_by = NULL,
                   verified_by_admin_id = NULL,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [status, registrationId]
            );
          }

          await client.query('COMMIT');
          transactionStarted = false;
          client.release();

          return res.status(200).json({
            success: true,
            message: 'Status verifikasi pendaftar berhasil diperbarui.',
            data: {
              id: registrationId,
              verification_status: status,
            },
          });

        } catch (error) {
          if (transactionStarted) {
            try {
              await client.query('ROLLBACK');
            } catch (rollbackError) {
              console.error(
                'Rollback status verifikasi:',
                rollbackError.message
              );
            }
          }

          client.release();

          if (
            ['40001', '40P01'].includes(error.code) &&
            attempt < MAX_TRANSACTION_ATTEMPTS
          ) {
            console.warn(
              `Konflik verifikasi. Percobaan ulang ${attempt + 1}/${MAX_TRANSACTION_ATTEMPTS}.`
            );
            continue;
          }

          if (['40001', '40P01'].includes(error.code)) {
            return res.status(409).json({
              success: false,
              message: 'Data sedang diproses bersamaan. Silakan coba kembali.',
            });
          }

          throw error;
        }
      }

      return res.status(409).json({
        success: false,
        message: 'Pembaruan status belum berhasil. Silakan coba kembali.',
      });

    } catch (error) {
      console.error('Update Registration Verification Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui status verifikasi.',
      });
    }
  },

};

module.exports = RegistrationController;

