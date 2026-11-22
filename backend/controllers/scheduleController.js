
const db = require('../config/db.pg');
const ExcelJS = require('exceljs');

// Memastikan ID berupa bilangan bulat positif.
const isValidId = (value) => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

// Memastikan tanggal benar-benar valid dalam format YYYY-MM-DD.
const isValidDate = (value) => {
  if (typeof value !== 'string') return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

// Menerima format HH:mm atau HH:mm:ss.
const normalizeTime = (value) => {
  if (typeof value !== 'string') return null;

  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);

  if (!match) return null;

  return `${match[1]}:${match[2]}:${match[3] || '00'}`;
};

const changeScheduleLock = async (req, res, shouldLock) => {
  const scheduleId = Number(req.params.id);

  if (!isValidId(scheduleId)) {
    return res.status(400).json({
      success: false,
      message: 'ID jadwal tidak valid.'
    });
  }

  let client;

  try {
    client = await db.connect();

    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    const result = await client.query(
      `SELECT id, status, is_locked, archived_at
       FROM schedules
       WHERE id = $1
       FOR UPDATE`,
      [scheduleId]
    );

    if (result.rowCount === 0) {
      throw Object.assign(
        new Error('Jadwal tidak ditemukan.'),
        { statusCode: 404 }
      );
    }

    const current = result.rows[0];

    if (current.archived_at !== null) {
      throw Object.assign(
        new Error('Jadwal arsip tidak dapat diubah status kuncinya.'),
        { statusCode: 409 }
      );
    }

    if (current.status === 'cancelled') {
      throw Object.assign(
        new Error('Jadwal yang dibatalkan tidak dapat diubah status kuncinya.'),
        { statusCode: 409 }
      );
    }

    if (current.status !== 'draft') {
      throw Object.assign(
        new Error('Jadwal Published tidak dapat diubah status kuncinya. Unpublish jadwal terlebih dahulu.'),
        { statusCode: 409 }
      );
    }

    if (current.is_locked === shouldLock) {
      throw Object.assign(
        new Error(
          shouldLock
            ? 'Jadwal sudah terkunci.'
            : 'Jadwal belum terkunci.'
        ),
        { statusCode: 409 }
      );
    }

    const updated = await client.query(
      `UPDATE schedules
       SET is_locked = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, is_locked, status, updated_at`,
      [shouldLock, scheduleId]
    );

    const action = shouldLock ? 'locked' : 'unlocked';

    await client.query(
      `INSERT INTO schedule_histories (
         schedule_id,
         action,
         old_data,
         new_data
       )
       VALUES ($1, $2, $3, $4)`,
      [
        scheduleId,
        action,
        JSON.stringify({
          is_locked: current.is_locked
        }),
        JSON.stringify({
          is_locked: shouldLock
        })
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: shouldLock
        ? 'Jadwal berhasil dikunci.'
        : 'Jadwal berhasil dibuka kuncinya.',
      data: updated.rows[0]
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback Lock Schedule Error:', rollbackError.message);
      }
    }

    console.error('Change Schedule Lock Error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === '40001') {
      return res.status(409).json({
        success: false,
        message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah status kunci jadwal.'
    });

  } finally {
    if (client) client.release();
  }
};
const ScheduleController = {
  // ==========================================
  // MEMBUAT BATCH DAN JADWAL
  // ==========================================
  createScheduleBatch: async (req, res) => {
    const { program_id, method, schedules } = req.body;

    // Validasi program.
    if (!isValidId(program_id)) {
      return res.status(400).json({
        success: false,
        message: 'ID program tidak valid.'
      });
    }

    // Validasi metode.
    if (!['dengan_sesi', 'tanpa_sesi'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Metode harus dengan_sesi atau tanpa_sesi.'
      });
    }

    // Validasi daftar jadwal.
    if (
      !Array.isArray(schedules) ||
      schedules.length === 0 ||
      schedules.length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal harus berupa array berisi 1 sampai 30 jadwal.'
      });
    }

    // Tanpa sesi hanya boleh memiliki satu jadwal.
    if (method === 'tanpa_sesi' && schedules.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Metode tanpa sesi hanya boleh memiliki satu jadwal.'
      });
    }

    const preparedSchedules = [];
    const allRegistrationIds = [];

    // ==========================================
    // VALIDASI DATA SETIAP JADWAL
    // ==========================================
    for (let i = 0; i < schedules.length; i++) {
      const item = schedules[i];

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return res.status(400).json({
          success: false,
          message: `Data jadwal ke-${i + 1} tidak valid.`
        });
      }

      const {
        session_name,
        date,
        start_time,
        end_time,
        location,
        registration_ids,
        show_participants
      } = item;

      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: `Tanggal jadwal ke-${i + 1} tidak valid.`
        });
      }

      const normalizedStart = normalizeTime(start_time);
      const normalizedEnd = normalizeTime(end_time);

      if (!normalizedStart || !normalizedEnd) {
        return res.status(400).json({
          success: false,
          message: `Format waktu jadwal ke-${i + 1} tidak valid.`
        });
      }

      if (normalizedEnd <= normalizedStart) {
        return res.status(400).json({
          success: false,
          message: `Waktu selesai jadwal ke-${i + 1} harus setelah waktu mulai.`
        });
      }

      // Validasi nama sesi.
      let normalizedSessionName = null;

      if (method === 'dengan_sesi') {
        if (
          typeof session_name !== 'string' ||
          !session_name.trim() ||
          session_name.trim().length > 50
        ) {
          return res.status(400).json({
            success: false,
            message: `Nama sesi ke-${i + 1} wajib diisi (maksimal 50 karakter).`
          });
        }

        normalizedSessionName = session_name.trim();
      }

      // Validasi lokasi.
      let normalizedLocation = null;

      if (location !== undefined && location !== null && location !== '') {
        if (
          typeof location !== 'string' ||
          location.trim().length > 100
        ) {
          return res.status(400).json({
            success: false,
            message: `Lokasi jadwal ke-${i + 1} maksimal 100 karakter.`
          });
        }

        normalizedLocation = location.trim();
      }

      // Validasi peserta.
      if (
        !Array.isArray(registration_ids) ||
        registration_ids.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Peserta jadwal ke-${i + 1} belum dipilih.`
        });
      }

      const participantIds = registration_ids.map(Number);

      if (!participantIds.every(isValidId)) {
        return res.status(400).json({
          success: false,
          message: `Terdapat ID pendaftar yang tidak valid pada jadwal ke-${i + 1}.`
        });
      }

      if (new Set(participantIds).size !== participantIds.length) {
        return res.status(400).json({
          success: false,
          message: `Terdapat peserta duplikat pada jadwal ke-${i + 1}.`
        });
      }

      allRegistrationIds.push(...participantIds);

      preparedSchedules.push({
        session_name: normalizedSessionName,
        date,
        start_time: normalizedStart,
        end_time: normalizedEnd,
        location: normalizedLocation,
        registration_ids: participantIds,
        show_participants: show_participants === true
      });
    }

    // Satu peserta hanya boleh ditempatkan pada satu sesi
    // dalam batch yang sama.
    if (new Set(allRegistrationIds).size !== allRegistrationIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Peserta yang sama tidak boleh dimasukkan ke lebih dari satu sesi dalam batch ini.'
      });
    }

    let client;

    try {
      client = await db.connect();

      // Transaksi serializable untuk membantu mencegah
      // dua proses bersamaan melewati pemeriksaan konflik.
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // ==========================================
      // VALIDASI PROGRAM
      // ==========================================
      const programResult = await client.query(
        `SELECT id, name
         FROM non_test_programs
         WHERE id = $1`,
        [program_id]
      );

      if (programResult.rowCount === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          success: false,
          message: 'Program layanan non-tes tidak ditemukan.'
        });
      }

      // ==========================================
      // VALIDASI PENDAFTAR
      // ==========================================
      const registrationResult = await client.query(
        `SELECT id, program_id
         FROM registrations
         WHERE id = ANY($1::int[])`,
        [allRegistrationIds]
      );

      if (registrationResult.rowCount !== allRegistrationIds.length) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message: 'Sebagian data pendaftar tidak ditemukan.'
        });
      }

      const invalidProgramRegistrations =
        registrationResult.rows.filter(
          (registration) =>
            Number(registration.program_id) !== Number(program_id)
        );

      if (invalidProgramRegistrations.length > 0) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          success: false,
          message: 'Terdapat pendaftar yang bukan berasal dari program yang dipilih.'
        });
      }

      // ==========================================
      // BUAT BATCH
      // ==========================================
      const batchResult = await client.query(
        `INSERT INTO schedule_batches (
          program_id,
          method
        )
        VALUES ($1, $2)
        RETURNING id, program_id, method, created_at`,
        [program_id, method]
      );

      const batch = batchResult.rows[0];
      const createdSchedules = [];

      // ==========================================
      // SIMPAN SETIAP JADWAL DAN PESERTANYA
      // ==========================================
      for (const item of preparedSchedules) {
        // ------------------------------------------
        // CEK BENTROK JADWAL PESERTA
        // Dalam program yang sama.
        // ------------------------------------------
        const participantConflict = await client.query(
          `SELECT
             sp.registration_id,
             r.name,
             r.nim,
             s.date,
             s.start_time,
             s.end_time
           FROM schedule_participants sp
           JOIN schedules s ON s.id = sp.schedule_id
           JOIN registrations r ON r.id = sp.registration_id
           WHERE s.program_id = $1
             AND COALESCE(s.status, 'draft') <> 'cancelled'
             AND s.archived_at IS NULL
             AND s.date = $2
             AND s.start_time < $4::time
             AND s.end_time > $3::time
             AND sp.registration_id = ANY($5::int[])
           LIMIT 1`,
          [
            program_id,
            item.date,
            item.start_time,
            item.end_time,
            item.registration_ids
          ]
        );

        if (participantConflict.rowCount > 0) {
          const conflict = participantConflict.rows[0];

          throw Object.assign(
            new Error(
              `Jadwal bentrok untuk peserta ${conflict.name} (NIM ${conflict.nim}).`
            ),
            { statusCode: 409 }
          );
        }

        // ------------------------------------------
        // CEK BENTROK LOKASI
        // Berlaku lintas program.
        // ------------------------------------------
        if (item.location) {
          const roomConflict = await client.query(
            `SELECT
               id,
               date,
               start_time,
               end_time,
               location
             FROM schedules
             WHERE LOWER(BTRIM(location)) = LOWER(BTRIM($1))
               AND date = $2
               AND COALESCE(status, 'draft') <> 'cancelled'
               AND archived_at IS NULL
               AND start_time < $4::time
               AND end_time > $3::time
             LIMIT 1`,
            [
              item.location,
              item.date,
              item.start_time,
              item.end_time
            ]
          );

          if (roomConflict.rowCount > 0) {
            throw Object.assign(
              new Error(
                `Lokasi ${item.location} sudah digunakan pada waktu tersebut.`
              ),
              { statusCode: 409 }
            );
          }
        }

        // ------------------------------------------
        // INSERT JADWAL
        // ------------------------------------------
        const scheduleResult = await client.query(
          `INSERT INTO schedules (
            program_id,
            batch_id,
            method,
            session_name,
            date,
            start_time,
            end_time,
            location,
            status,
            is_locked,
            show_participants
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            'draft', false, $9
          )
          RETURNING *`,
          [
            program_id,
            batch.id,
            method,
            item.session_name,
            item.date,
            item.start_time,
            item.end_time,
            item.location,
            item.show_participants
          ]
        );

        const schedule = scheduleResult.rows[0];

        // ------------------------------------------
        // INSERT PESERTA
        // ------------------------------------------
        for (const registrationId of item.registration_ids) {
          await client.query(
            `INSERT INTO schedule_participants (
              schedule_id,
              registration_id
            )
            VALUES ($1, $2)`,
            [schedule.id, registrationId]
          );
        }

        // ------------------------------------------
        // SIMPAN RIWAYAT PEMBUATAN
        // ------------------------------------------
        const historyData = {
          schedule_id: schedule.id,
          program_id: Number(program_id),
          method,
          session_name: item.session_name,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          location: item.location,
          status: 'draft',
          show_participants: item.show_participants,
          participant_count: item.registration_ids.length,
          registration_ids: item.registration_ids
        };

        await client.query(
          `INSERT INTO schedule_histories (
            schedule_id,
            action,
            old_data,
            new_data
          )
          VALUES ($1, $2, $3, $4)`,
          [
            schedule.id,
            'created',
            null,
            JSON.stringify(historyData)
          ]
        );

        createdSchedules.push({
          ...schedule,
          participant_count: item.registration_ids.length
        });
      }

      // ==========================================
      // SELESAIKAN TRANSAKSI
      // ==========================================
      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        message: 'Batch jadwal berhasil dibuat.',
        data: {
          batch,
          program: programResult.rows[0],
          schedules: createdSchedules
        }
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback gagal:', rollbackError.message);
        }
      }

      console.error('Create Schedule Batch Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      // Transaksi serializable dapat gagal jika ada
      // transaksi bersamaan yang saling bertabrakan.
      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi proses penjadwalan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat membuat jadwal.'
      });

    } finally {
      if (client) {
        client.release();
      }
    }
  },
  // ==========================================
  // MENAMPILKAN DAFTAR JADWAL ADMIN
  // ==========================================
  // ==========================================
  // MENGUBAH JADWAL
  // ==========================================
  updateSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);
    const body = req.body || {};

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    const {
      session_name,
      date,
      start_time,
      end_time,
      location,
      registration_ids,
      show_participants
    } = body;

    const normalizedShowParticipants =
      typeof show_participants === 'boolean'
        ? show_participants
        : null;

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal jadwal tidak valid.'
      });
    }

    const normalizedStart = normalizeTime(start_time);
    const normalizedEnd = normalizeTime(end_time);

    if (!normalizedStart || !normalizedEnd) {
      return res.status(400).json({
        success: false,
        message: 'Format waktu tidak valid.'
      });
    }

    if (normalizedEnd <= normalizedStart) {
      return res.status(400).json({
        success: false,
        message: 'Waktu selesai harus setelah waktu mulai.'
      });
    }

    if (
      !Array.isArray(registration_ids) ||
      registration_ids.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: 'Daftar peserta tidak valid.'
      });
    }

    const participantIds = registration_ids.map(Number);

    if (!participantIds.every(isValidId)) {
      return res.status(400).json({
        success: false,
        message: 'Terdapat ID peserta yang tidak valid.'
      });
    }

    if (new Set(participantIds).size !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Terdapat peserta duplikat.'
      });
    }

    let normalizedSessionName = null;

    if (
      typeof session_name === 'string' &&
      session_name.trim()
    ) {
      normalizedSessionName = session_name.trim();
    }

    if (
      normalizedSessionName &&
      normalizedSessionName.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nama sesi maksimal 50 karakter.'
      });
    }

    let normalizedLocation = null;

    if (location !== undefined && location !== null && location !== '') {
      if (
        typeof location !== 'string' ||
        location.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Lokasi maksimal 100 karakter.'
        });
      }

      normalizedLocation = location.trim();
    }

    let client;

    try {
      client = await db.connect();

      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Ambil jadwal dan kunci baris selama transaksi.
      const scheduleResult = await client.query(
        `SELECT
           id,
           program_id,
           batch_id,
           method,
           session_name,
           TO_CHAR(date, 'YYYY-MM-DD') AS date,
           TO_CHAR(start_time, 'HH24:MI:SS') AS start_time,
           TO_CHAR(end_time, 'HH24:MI:SS') AS end_time,
           location,
           status,
           is_locked,
           show_participants,
           archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (scheduleResult.rowCount === 0) {
        throw Object.assign(
          new Error('Jadwal tidak ditemukan.'),
          { statusCode: 404 }
        );
      }

      const current = scheduleResult.rows[0];

      if (current.archived_at !== null) {
        throw Object.assign(
          new Error('Jadwal arsip tidak dapat diedit.'),
          { statusCode: 409 }
        );
      }

      if (current.is_locked) {
        throw Object.assign(
          new Error('Jadwal terkunci dan tidak dapat diedit.'),
          { statusCode: 409 }
        );
      }

      if (current.status === 'cancelled') {
        throw Object.assign(
          new Error('Jadwal yang dibatalkan tidak dapat diedit.'),
          { statusCode: 409 }
        );
      }

      if (current.status !== 'draft') {
        throw Object.assign(
          new Error('Hanya jadwal Draft yang dapat diedit. Unpublish jadwal terlebih dahulu.'),
          { statusCode: 409 }
        );
      }

      if (
        current.method === 'dengan_sesi' &&
        !normalizedSessionName
      ) {
        throw Object.assign(
          new Error('Nama sesi wajib diisi untuk jadwal dengan sesi.'),
          { statusCode: 400 }
        );
      }

      if (current.method === 'tanpa_sesi' && normalizedSessionName) {
        throw Object.assign(
          new Error('Jadwal tanpa sesi tidak boleh memiliki nama sesi.'),
          { statusCode: 400 }
        );
      }

      // Pastikan semua peserta berasal dari program yang sama.
      const registrationResult = await client.query(
        `SELECT id
         FROM registrations
         WHERE id = ANY($1::int[])
           AND program_id = $2`,
        [participantIds, current.program_id]
      );

      if (registrationResult.rowCount !== participantIds.length) {
        throw Object.assign(
          new Error('Terdapat peserta yang tidak ditemukan atau bukan dari program ini.'),
          { statusCode: 400 }
        );
      }

      // Ambil peserta lama beserta status WhatsApp.
      const oldParticipantsResult = await client.query(
        `SELECT
           registration_id,
           whatsapp_status,
           whatsapp_sent_at
         FROM schedule_participants
         WHERE schedule_id = $1
         ORDER BY registration_id`,
        [scheduleId]
      );

      const oldData = {
        ...current,
        participants: oldParticipantsResult.rows
      };

      // Cek bentrok jadwal peserta pada program yang sama.
      const participantConflict = await client.query(
        `SELECT
           r.name,
           r.nim
         FROM schedule_participants sp
         JOIN schedules s ON s.id = sp.schedule_id
         JOIN registrations r ON r.id = sp.registration_id
         WHERE s.program_id = $1
           AND s.id <> $2
           AND COALESCE(s.status, 'draft') <> 'cancelled'
             AND s.archived_at IS NULL
           AND s.date = $3
           AND s.start_time < $5::time
           AND s.end_time > $4::time
           AND sp.registration_id = ANY($6::int[])
         LIMIT 1`,
        [
          current.program_id,
          scheduleId,
          date,
          normalizedStart,
          normalizedEnd,
          participantIds
        ]
      );

      if (participantConflict.rowCount > 0) {
        const conflict = participantConflict.rows[0];

        throw Object.assign(
          new Error(
            `Jadwal bentrok untuk peserta ${conflict.name} (NIM ${conflict.nim}).`
          ),
          { statusCode: 409 }
        );
      }

      // Cek bentrok lokasi lintas program.
      if (normalizedLocation) {
        const roomConflict = await client.query(
          `SELECT id
           FROM schedules
           WHERE id <> $5
             AND LOWER(BTRIM(location)) = LOWER(BTRIM($1))
             AND date = $2
             AND COALESCE(status, 'draft') <> 'cancelled'
               AND archived_at IS NULL
             AND start_time < $4::time
             AND end_time > $3::time
           LIMIT 1`,
          [
            normalizedLocation,
            date,
            normalizedStart,
            normalizedEnd,
            scheduleId
          ]
        );

        if (roomConflict.rowCount > 0) {
          throw Object.assign(
            new Error('Lokasi sudah digunakan pada waktu tersebut.'),
            { statusCode: 409 }
          );
        }
      }

      // Update informasi jadwal.
      const updatedResult = await client.query(
        `UPDATE schedules
         SET
           session_name = $1,
           date = $2,
           start_time = $3,
           end_time = $4,
           location = $5,
           show_participants = COALESCE($6, show_participants),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          normalizedSessionName,
          date,
          normalizedStart,
          normalizedEnd,
          normalizedLocation,
          normalizedShowParticipants,
          scheduleId
        ]
      );

      // Hapus hanya peserta yang sudah tidak dipilih.
      // Peserta lama yang dipertahankan tetap memiliki status WhatsApp.
      await client.query(
        `DELETE FROM schedule_participants
         WHERE schedule_id = $1
           AND NOT (registration_id = ANY($2::int[]))`,
        [scheduleId, participantIds]
      );

      // Masukkan peserta baru tanpa mereset peserta lama.
      for (const registrationId of participantIds) {
        await client.query(
          `INSERT INTO schedule_participants (
             schedule_id,
             registration_id
           )
           VALUES ($1, $2)
           ON CONFLICT (schedule_id, registration_id) DO NOTHING`,
          [scheduleId, registrationId]
        );
      }

      const newData = {
        ...updatedResult.rows[0],
        registration_ids: participantIds,
        participant_count: participantIds.length
      };

      // Catat riwayat perubahan.
      await client.query(
        `INSERT INTO schedule_histories (
           schedule_id,
           action,
           old_data,
           new_data
         )
         VALUES ($1, $2, $3, $4)`,
        [
          scheduleId,
          'updated',
          JSON.stringify(oldData),
          JSON.stringify(newData)
        ]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal berhasil diperbarui.',
        data: {
          ...updatedResult.rows[0],
          participant_count: participantIds.length,
          registration_ids: participantIds
        }
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback Update Schedule Error:', rollbackError.message);
        }
      }

      console.error('Update Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan jadwal secara bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengubah jadwal.'
      });

    } finally {
      if (client) {
        client.release();
      }
    }
  },
  // ==========================================
  // KUNCI JADWAL
  // ==========================================
  lockSchedule: (req, res) => changeScheduleLock(req, res, true),

  // ==========================================
  // BUKA KUNCI JADWAL
  // ==========================================
  unlockSchedule: (req, res) => changeScheduleLock(req, res, false),
  getAllSchedulesAdmin: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
           s.id,
           s.program_id,
           s.batch_id,
           s.method,
           s.session_name,
           TO_CHAR(s.date, 'YYYY-MM-DD') AS date,
           TO_CHAR(s.start_time, 'HH24:MI:SS') AS start_time,
           TO_CHAR(s.end_time, 'HH24:MI:SS') AS end_time,
           s.location,
           s.status,
           s.is_locked,
           s.show_participants,
           s.created_at,
           s.updated_at,
           s.archived_at,

           p.name AS program_name,
           b.created_at AS batch_created_at,

           COUNT(sp.registration_id)::int AS participant_count,

           COALESCE(
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'registration_id', r.id,
                 'name', r.name,
                 'nim', r.nim,
                 'class', r.class,
                 'semester', r.semester,
                 'major_id', r.major_id,
                 'phone', r.phone
               )
               ORDER BY r.name
             ) FILTER (WHERE r.id IS NOT NULL),
             '[]'::json
           ) AS participants

         FROM schedules s

         JOIN non_test_programs p
           ON p.id = s.program_id

         JOIN schedule_batches b
           ON b.id = s.batch_id

         LEFT JOIN schedule_participants sp
           ON sp.schedule_id = s.id

         LEFT JOIN registrations r
           ON r.id = sp.registration_id

         WHERE s.archived_at IS NULL
         GROUP BY s.id, p.id, b.id

         ORDER BY s.date ASC, s.start_time ASC, s.id ASC`
      );

      return res.status(200).json({
        success: true,
        message: 'Daftar jadwal berhasil diambil.',
        total: result.rowCount,
        data: result.rows
      });

    } catch (error) {
      console.error('Get All Schedules Admin Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil daftar jadwal.'
      });
    }
  }  ,
  // ==========================================
  // MENAMPILKAN DAFTAR JADWAL ARSIP ADMIN
  // ==========================================
  getArchivedSchedulesAdmin: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
           s.id,
           s.program_id,
           s.batch_id,
           s.method,
           s.session_name,
           TO_CHAR(s.date, 'YYYY-MM-DD') AS date,
           TO_CHAR(s.start_time, 'HH24:MI:SS') AS start_time,
           TO_CHAR(s.end_time, 'HH24:MI:SS') AS end_time,
           s.location,
           s.status,
           s.is_locked,
           s.show_participants,
           s.created_at,
           s.updated_at,
           s.archived_at,
           p.name AS program_name,
           b.created_at AS batch_created_at,
           COUNT(sp.registration_id)::int AS participant_count,
           COALESCE(
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'registration_id', r.id,
                 'name', r.name,
                 'nim', r.nim,
                 'class', r.class,
                 'semester', r.semester,
                 'major_id', r.major_id,
                 'phone', r.phone
               )
               ORDER BY r.name
             ) FILTER (WHERE r.id IS NOT NULL),
             '[]'::json
           ) AS participants
         FROM schedules s
         JOIN non_test_programs p ON p.id = s.program_id
         JOIN schedule_batches b ON b.id = s.batch_id
         LEFT JOIN schedule_participants sp ON sp.schedule_id = s.id
         LEFT JOIN registrations r ON r.id = sp.registration_id
         WHERE s.archived_at IS NOT NULL
         GROUP BY s.id, p.id, b.id
         ORDER BY s.archived_at DESC, s.date ASC, s.start_time ASC`
      );

      return res.status(200).json({
        success: true,
        message: 'Daftar jadwal arsip berhasil diambil.',
        total: result.rowCount,
        data: result.rows
      });
    } catch (error) {
      console.error('Get Archived Schedules Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil jadwal arsip.'
      });
    }
  },

  // ==========================================
  // MENAMPILKAN RIWAYAT AKTIVITAS JADWAL ADMIN
  // ==========================================
  getScheduleHistories: async (req, res) => {
    try {
      const rawProgramId = req.query.program_id;
      const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || 100, 1),
        300
      );

      let programId = null;

      if (rawProgramId !== undefined) {
        if (!isValidId(rawProgramId)) {
          return res.status(400).json({
            success: false,
            message: 'ID program tidak valid.'
          });
        }

        programId = Number(rawProgramId);
      }

      const result = await db.query(
        `SELECT
           h.id,
           h.schedule_id,
           h.action,
           h.old_data,
           h.new_data,
           h.schedule_snapshot,
           h.created_at,

           COALESCE(
             s.program_id,
             NULLIF(h.schedule_snapshot->>'program_id', '')::int
           ) AS program_id,

           COALESCE(
             p.name,
             h.schedule_snapshot->>'program_name'
           ) AS program_name,

           COALESCE(
             s.method,
             h.schedule_snapshot->>'method'
           ) AS method,

           COALESCE(
             s.session_name,
             h.schedule_snapshot->>'session_name'
           ) AS session_name,

           COALESCE(
             TO_CHAR(s.date, 'YYYY-MM-DD'),
             h.schedule_snapshot->>'date'
           ) AS schedule_date,

           COALESCE(
             TO_CHAR(s.start_time, 'HH24:MI:SS'),
             h.schedule_snapshot->>'start_time'
           ) AS start_time,

           COALESCE(
             TO_CHAR(s.end_time, 'HH24:MI:SS'),
             h.schedule_snapshot->>'end_time'
           ) AS end_time,

           (s.id IS NULL) AS schedule_deleted

         FROM schedule_histories h

         LEFT JOIN schedules s
           ON s.id = h.schedule_id

         LEFT JOIN non_test_programs p
           ON p.id = COALESCE(
             s.program_id,
             NULLIF(h.schedule_snapshot->>'program_id', '')::int
           )

         WHERE (
           $1::int IS NULL
           OR COALESCE(
             s.program_id,
             NULLIF(h.schedule_snapshot->>'program_id', '')::int
           ) = $1
         )

         ORDER BY h.created_at DESC, h.id DESC
         LIMIT $2`,
        [programId, limit]
      );

      return res.status(200).json({
        success: true,
        message: 'Riwayat aktivitas jadwal berhasil diambil.',
        total: result.rowCount,
        data: result.rows
      });

    } catch (error) {
      console.error('Get Schedule Histories Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil riwayat jadwal.'
      });
    }
  },
  // ==========================================
  // MENAMPILKAN JADWAL UNTUK PUBLIK
  // Hanya mengirim nama prodi dan kelas peserta.
  // ==========================================
  // ==========================================
  // UNDUH JADWAL DAN DAFTAR PESERTA PUBLIK
  // Hanya menampilkan Program Studi dan Kelas.
  // ==========================================
  deleteSelectedScheduleHistories: async (req, res) => {
    const programId = Number(req.body.program_id);
    const rawIds = req.body.ids;

    if (!isValidId(programId)) {
      return res.status(400).json({
        success: false,
        message: 'ID program tidak valid.'
      });
    }

    if (
      !Array.isArray(rawIds) ||
      rawIds.length < 1 ||
      rawIds.length > 300
    ) {
      return res.status(400).json({
        success: false,
        message: 'Pilih 1 sampai 300 riwayat yang ingin dihapus.'
      });
    }

    const historyIds = rawIds.map(Number);

    if (!historyIds.every(isValidId)) {
      return res.status(400).json({
        success: false,
        message: 'Terdapat ID riwayat yang tidak valid.'
      });
    }

    const uniqueHistoryIds = [...new Set(historyIds)];

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const programResult = await client.query(
        `SELECT id
         FROM non_test_programs
         WHERE id = $1`,
        [programId]
      );

      if (programResult.rowCount === 0) {
        throw Object.assign(
          new Error('Program layanan non-tes tidak ditemukan.'),
          { statusCode: 404 }
        );
      }

      const deleteResult = await client.query(
        `DELETE FROM schedule_histories h
         WHERE h.id = ANY($1::int[])
           AND (
             EXISTS (
               SELECT 1
               FROM schedules s
               WHERE s.id = h.schedule_id
                 AND s.program_id = $2
             )
             OR (
               h.schedule_id IS NULL
               AND CASE
                 WHEN h.schedule_snapshot->>'program_id' ~ '^[0-9]+$'
                 THEN (h.schedule_snapshot->>'program_id')::int
                 ELSE NULL
               END = $2
             )
           )
         RETURNING h.id`,
        [uniqueHistoryIds, programId]
      );

      const deletedIds = deleteResult.rows.map((row) => row.id);

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: deletedIds.length > 0
          ? `${deletedIds.length} riwayat aktivitas berhasil dihapus.`
          : 'Tidak ada riwayat terpilih yang cocok dengan program ini.',
        data: {
          deleted_count: deletedIds.length,
          deleted_ids: deletedIds,
          requested_count: uniqueHistoryIds.length
        }
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(
            'Rollback Delete Selected Histories Error:',
            rollbackError.message
          );
        }
      }

      console.error('Delete Selected Histories Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus riwayat aktivitas.'
      });

    } finally {
      if (client) client.release();
    }
  },
  downloadPublicSchedules: async (req, res) => {
    try {
      const scheduleId = Number(req.params.scheduleId);
      const format = String(req.query.format || 'xlsx').toLowerCase();

      if (!isValidId(scheduleId)) {
        return res.status(400).json({
          success: false,
          message: 'ID jadwal tidak valid.'
        });
      }

      if (!['xlsx', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Format unduhan harus xlsx atau csv.'
        });
      }

      const result = await db.query(
        `SELECT
           s.id,
           p.name AS program_name,
           s.method,
           s.session_name,
           TO_CHAR(s.date, 'DD-MM-YYYY') AS date,
           TO_CHAR(s.start_time, 'HH24:MI') AS start_time,
           TO_CHAR(s.end_time, 'HH24:MI') AS end_time,
           s.location,
           s.show_participants,

           CASE
             WHEN s.show_participants
             THEN COUNT(sp.registration_id)::int
             ELSE NULL
           END AS participant_count,

           CASE
             WHEN s.show_participants
             THEN COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'name', r.name,
                   'major',
                   CASE
                     WHEN m.id IS NOT NULL THEN
                       CONCAT_WS(
                         ' ',
                         NULLIF(BTRIM(m.jenjang), ''),
                         NULLIF(BTRIM(m.prodi), '')
                       ) ||
                       CASE
                         WHEN NULLIF(BTRIM(m.jurusan), '') IS NOT NULL
                         THEN ' (' || BTRIM(m.jurusan) || ')'
                         ELSE ''
                       END
                     ELSE 'Prodi tidak tersedia'
                   END,
                   'class', r.class
                 )
                 ORDER BY m.prodi ASC, r.class ASC
               ) FILTER (WHERE r.id IS NOT NULL),
               '[]'::json
             )
             ELSE NULL
           END AS participants

         FROM schedules s
         JOIN non_test_programs p
           ON p.id = s.program_id
         LEFT JOIN schedule_participants sp
           ON sp.schedule_id = s.id
         LEFT JOIN registrations r
           ON r.id = sp.registration_id
         LEFT JOIN public.majors m
           ON m.id = r.major_id

         WHERE s.id = $1
           AND s.status = 'published'
           AND s.archived_at IS NULL

         GROUP BY s.id, p.id`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal tidak ditemukan atau belum dipublikasikan.'
        });
      }

      const schedule = result.rows[0];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Daftar Peserta');

      worksheet.columns = [
        { header: 'Nama', key: 'name', width: 30 },
        { header: 'Kelas', key: 'class', width: 15 },
        { header: 'Program Studi', key: 'major', width: 35 },
        { header: 'Program', key: 'program', width: 30 },
        { header: 'Sesi', key: 'session', width: 20 },
        { header: 'Tanggal', key: 'date', width: 16 },
        { header: 'Waktu Mulai', key: 'start', width: 15 },
        { header: 'Waktu Selesai', key: 'end', width: 15 },
        { header: 'Lokasi', key: 'location', width: 25 }
      ];

      // Mencegah teks dari database dianggap sebagai formula spreadsheet.
      const safeText = (value) => {
        if (value === null || value === undefined || value === '') {
          return '-';
        }

        const text = String(value);

        return /^[\s]*[=+\-@]/.test(text)
          ? "'" + text
          : text;
      };

      const baseData = {
        program: safeText(schedule.program_name),
        session: safeText(
          schedule.method === 'tanpa_sesi'
            ? 'Tanpa Sesi'
            : schedule.session_name
        ),
        date: safeText(schedule.date),
        start: safeText(schedule.start_time),
        end: safeText(schedule.end_time),
        location: safeText(schedule.location)
      };

      if (!schedule.show_participants) {
        worksheet.addRow({
          name: 'Daftar peserta tidak ditampilkan',
          class: '-',
          major: '-',
          ...baseData
        });
      } else {
        const participants = Array.isArray(schedule.participants)
          ? schedule.participants
          : [];

        if (participants.length === 0) {
          worksheet.addRow({
            name: 'Belum ada peserta',
            class: '-',
            major: '-',
            ...baseData
          });
        } else {
          for (const participant of participants) {
            worksheet.addRow({
              name: safeText(participant.name),
              class: safeText(participant.class),
              major: safeText(participant.major),
              ...baseData
            });
          }
        }
      }

      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const fileName = `jadwal-${scheduleId}`;

      if (format === 'csv') {
        res.setHeader(
          'Content-Type',
          'text/csv; charset=utf-8'
        );

        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileName}.csv"`
        );

        res.write('\uFEFF');
        await workbook.csv.write(res);
        return res.end();
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}.xlsx"`
      );

      await workbook.xlsx.write(res);
      return res.end();

    } catch (error) {
      console.error('Download Public Schedule Error:', error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat membuat file unduhan.'
        });
      }
    }
  },
  getPublicSchedules: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
           s.id,
           s.program_id,
           p.name AS program_name,
           s.method,
           s.session_name,
           TO_CHAR(s.date, 'YYYY-MM-DD') AS date,
           TO_CHAR(s.start_time, 'HH24:MI:SS') AS start_time,
           TO_CHAR(s.end_time, 'HH24:MI:SS') AS end_time,
           s.location,

           CASE
             WHEN s.show_participants
             THEN COUNT(sp.registration_id)::int
             ELSE NULL
           END AS participant_count,

           CASE
             WHEN s.show_participants
             THEN COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'name', r.name,
                   'major',
                   CASE
                     WHEN m.id IS NOT NULL THEN
                       CONCAT_WS(
                         ' ',
                         NULLIF(BTRIM(m.jenjang), ''),
                         NULLIF(BTRIM(m.prodi), '')
                       ) ||
                       CASE
                         WHEN NULLIF(BTRIM(m.jurusan), '') IS NOT NULL
                         THEN ' (' || BTRIM(m.jurusan) || ')'
                         ELSE ''
                       END
                     ELSE 'Prodi tidak tersedia'
                   END,
                   'class', r.class
                 )
                 ORDER BY m.prodi ASC, r.class ASC
               ) FILTER (WHERE r.id IS NOT NULL),
               '[]'::json
             )
             ELSE NULL
           END AS participants

         FROM schedules s

         JOIN non_test_programs p
           ON p.id = s.program_id

         LEFT JOIN schedule_participants sp
           ON sp.schedule_id = s.id

         LEFT JOIN registrations r
           ON r.id = sp.registration_id

         LEFT JOIN public.majors m
           ON m.id = r.major_id

         WHERE s.status = 'published'
           AND s.archived_at IS NULL

         GROUP BY s.id, p.id

         ORDER BY s.date ASC, s.start_time ASC, s.id ASC`
      );

      return res.status(200).json({
        success: true,
        message: 'Jadwal publik berhasil diambil.',
        total: result.rowCount,
        data: result.rows
      });

    } catch (error) {
      console.error('Get Public Schedules Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil jadwal publik.'
      });
    }
  },
  // ==========================================
  // PUBLIKASI JADWAL DRAFT
  // ==========================================
  publishSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const result = await client.query(
        `SELECT id, status, is_locked, archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        throw Object.assign(new Error('Jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const current = result.rows[0];

      if (!current.is_locked) {
        throw Object.assign(
          new Error('Kunci jadwal terlebih dahulu sebelum memublikasikannya.'),
          { statusCode: 409 }
        );
      }

      if (current.archived_at !== null) {
        throw Object.assign(new Error('Jadwal arsip tidak dapat dipublikasikan.'), {
          statusCode: 409
        });
      }

      if (current.status !== 'draft') {
        throw Object.assign(new Error('Hanya jadwal Draft yang dapat dipublikasikan.'), {
          statusCode: 409
        });
      }

      const updated = await client.query(
        `UPDATE schedules
         SET status = 'published',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, status, archived_at, updated_at`,
        [scheduleId]
      );

      await client.query(
        `INSERT INTO schedule_histories (
           schedule_id, action, old_data, new_data
         )
         VALUES ($1, 'published', $2, $3)`,
        [
          scheduleId,
          JSON.stringify({ status: current.status }),
          JSON.stringify({ status: 'published' })
        ]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal berhasil dipublikasikan.',
        data: updated.rows[0]
      });
    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (e) {
          console.error('Rollback Publish Error:', e.message);
        }
      }

      console.error('Publish Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memublikasikan jadwal.'
      });
    } finally {
      if (client) client.release();
    }
  },

  // ==========================================
  // KEMBALIKAN JADWAL PUBLISHED MENJADI DRAFT
  // ==========================================
  unpublishSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const result = await client.query(
        `SELECT id, program_id, status, is_locked, archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        throw Object.assign(new Error('Jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const current = result.rows[0];

      if (current.archived_at !== null) {
        throw Object.assign(
          new Error('Jadwal arsip tidak dapat dikembalikan ke Draft. Pulihkan jadwal dari arsip terlebih dahulu.'),
          { statusCode: 409 }
        );
      }

      if (current.status !== 'published') {
        throw Object.assign(
          new Error('Hanya jadwal Published yang dapat dikembalikan ke Draft.'),
          { statusCode: 409 }
        );
      }

      const updated = await client.query(
        `UPDATE schedules
         SET status = 'draft',
             is_locked = false,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, program_id, status, is_locked, archived_at, updated_at`,
        [scheduleId]
      );

      await client.query(
        `INSERT INTO schedule_histories (
           schedule_id,
           action,
           old_data,
           new_data
         )
         VALUES ($1, 'unpublished', $2, $3)`,
        [
          scheduleId,
          JSON.stringify({
            status: current.status,
            is_locked: current.is_locked
          }),
          JSON.stringify({
            status: 'draft',
            is_locked: false
          })
        ]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal berhasil dikembalikan ke Draft dan kunci dibuka. Data peserta dan pendaftaran tetap tersimpan.',
        data: updated.rows[0]
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback Unpublish Error:', rollbackError.message);
        }
      }

      console.error('Unpublish Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengembalikan jadwal ke Draft.'
      });

    } finally {
      if (client) client.release();
    }
  },
  // ==========================================
  // ARSIPKAN JADWAL YANG SUDAH DIPUBLIKASIKAN
  // ==========================================
  archiveSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const result = await client.query(
        `SELECT id, status, is_locked, archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        throw Object.assign(new Error('Jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const current = result.rows[0];

      if (current.archived_at !== null) {
        throw Object.assign(new Error('Jadwal sudah berada di arsip.'), {
          statusCode: 409
        });
      }

      if (current.status !== 'draft') {
        throw Object.assign(
          new Error('Unpublish jadwal terlebih dahulu sebelum mengarsipkan jadwal.'),
          { statusCode: 409 }
        );
      }

      if (current.is_locked) {
        throw Object.assign(
          new Error('Buka kunci jadwal terlebih dahulu sebelum mengarsipkan jadwal.'),
          { statusCode: 409 }
        );
      }

      const updated = await client.query(
        `UPDATE schedules
         SET archived_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, status, archived_at, updated_at`,
        [scheduleId]
      );

      await client.query(
        `INSERT INTO schedule_histories (
           schedule_id, action, old_data, new_data
         )
         VALUES ($1, 'archived', $2, $3)`,
        [
          scheduleId,
          JSON.stringify({ archived_at: null }),
          JSON.stringify({ archived_at: updated.rows[0].archived_at })
        ]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal berhasil diarsipkan.',
        data: updated.rows[0]
      });
    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (e) {
          console.error('Rollback Archive Error:', e.message);
        }
      }

      console.error('Archive Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengarsipkan jadwal.'
      });
    } finally {
      if (client) client.release();
    }
  },

  // ==========================================
  // PULIHKAN JADWAL DARI ARSIP
  // ==========================================
  restoreSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const result = await client.query(
        `SELECT id, status, is_locked, archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        throw Object.assign(new Error('Jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const current = result.rows[0];

      if (current.archived_at === null) {
        throw Object.assign(new Error('Jadwal tersebut tidak berada di arsip.'), {
          statusCode: 409
        });
      }

      const updated = await client.query(
        `UPDATE schedules
         SET archived_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, status, archived_at, updated_at`,
        [scheduleId]
      );

      await client.query(
        `INSERT INTO schedule_histories (
           schedule_id, action, old_data, new_data
         )
         VALUES ($1, 'restored', $2, $3)`,
        [
          scheduleId,
          JSON.stringify({ archived_at: current.archived_at }),
          JSON.stringify({ archived_at: null })
        ]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal berhasil dipulihkan dari arsip.',
        data: updated.rows[0]
      });
    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (e) {
          console.error('Rollback Restore Error:', e.message);
        }
      }

      console.error('Restore Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memulihkan jadwal.'
      });
    } finally {
      if (client) client.release();
    }
  },

  // ==========================================
  // HAPUS JADWAL DRAFT YANG BELUM TERKUNCI
  // ==========================================
  deleteDraftSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const result = await client.query(
        `SELECT id, status, is_locked, archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        throw Object.assign(new Error('Jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const current = result.rows[0];

      if (current.status !== 'draft' || current.archived_at !== null) {
        throw Object.assign(
          new Error('Hanya jadwal Draft aktif yang dapat dihapus melalui fitur ini.'),
          { statusCode: 409 }
        );
      }

      if (current.is_locked) {
        throw Object.assign(
          new Error('Buka kunci jadwal terlebih dahulu sebelum menghapusnya.'),
          { statusCode: 409 }
        );
      }

      // Ambil snapshot jadwal sebelum data jadwal dihapus.
      const snapshotResult = await client.query(
        `SELECT
           s.id,
           s.program_id,
           p.name AS program_name,
           s.batch_id,
           s.method,
           s.session_name,
           TO_CHAR(s.date, 'YYYY-MM-DD') AS date,
           TO_CHAR(s.start_time, 'HH24:MI:SS') AS start_time,
           TO_CHAR(s.end_time, 'HH24:MI:SS') AS end_time,
           s.location,
           s.status,
           s.is_locked,
           s.show_participants,
           s.created_at,
           s.updated_at,
           s.archived_at,
           (
             SELECT COUNT(*)::int
             FROM schedule_participants sp
             WHERE sp.schedule_id = s.id
           ) AS participant_count
         FROM schedules s
         JOIN non_test_programs p
           ON p.id = s.program_id
         WHERE s.id = $1`,
        [scheduleId]
      );

      if (snapshotResult.rowCount === 0) {
        throw Object.assign(new Error('Data jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const snapshot = snapshotResult.rows[0];

      // Simpan snapshot ke seluruh riwayat jadwal.
      // Catatan aktivitas lama tidak dihapus.
      await client.query(
        `UPDATE schedule_histories
         SET schedule_snapshot = $1::jsonb
         WHERE schedule_id = $2`,
        [JSON.stringify(snapshot), scheduleId]
      );

      // Hapus hubungan peserta dengan jadwal saja.
      // Data pendaftaran mahasiswa tetap dipertahankan.
      await client.query(
        `DELETE FROM schedule_participants
         WHERE schedule_id = $1`,
        [scheduleId]
      );

      // Hapus jadwal. Riwayat tetap disimpan dan relasinya
      // diputus melalui aturan foreign key yang berlaku.
      await client.query(
        `DELETE FROM schedules
         WHERE id = $1`,
        [scheduleId]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal Draft berhasil dihapus. Peserta kembali tersedia di daftar pendaftar dan riwayat aktivitas tetap tersimpan.'
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback Delete Draft Error:', e.message);
        }
      }

      console.error('Delete Draft Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus jadwal Draft.'
      });
    } finally {
      if (client) client.release();
    }
  },

  // ==========================================
  // HAPUS PERMANEN JADWAL YANG SUDAH DIARSIPKAN
  // ==========================================
  deleteArchivedSchedule: async (req, res) => {
    const scheduleId = Number(req.params.id);

    if (!isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID jadwal tidak valid.'
      });
    }

    let client;

    try {
      client = await db.connect();
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Kunci dan periksa jadwal arsip.
      const result = await client.query(
        `SELECT id, archived_at
         FROM schedules
         WHERE id = $1
         FOR UPDATE`,
        [scheduleId]
      );

      if (result.rowCount === 0) {
        throw Object.assign(new Error('Jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      if (result.rows[0].archived_at === null) {
        throw Object.assign(
          new Error('Hanya jadwal yang berada di arsip yang dapat dihapus permanen.'),
          { statusCode: 409 }
        );
      }

      // Ambil snapshot informasi jadwal sebelum dihapus.
      const snapshotResult = await client.query(
        `SELECT
           s.id,
           s.program_id,
           p.name AS program_name,
           s.batch_id,
           s.method,
           s.session_name,
           TO_CHAR(s.date, 'YYYY-MM-DD') AS date,
           TO_CHAR(s.start_time, 'HH24:MI:SS') AS start_time,
           TO_CHAR(s.end_time, 'HH24:MI:SS') AS end_time,
           s.location,
           s.status,
           s.is_locked,
           s.show_participants,
           s.created_at,
           s.updated_at,
           s.archived_at,
           (
             SELECT COUNT(*)::int
             FROM schedule_participants sp
             WHERE sp.schedule_id = s.id
           ) AS participant_count
         FROM schedules s
         JOIN non_test_programs p
           ON p.id = s.program_id
         WHERE s.id = $1`,
        [scheduleId]
      );

      if (snapshotResult.rowCount === 0) {
        throw Object.assign(new Error('Data jadwal tidak ditemukan.'), {
          statusCode: 404
        });
      }

      const snapshot = snapshotResult.rows[0];

      // Simpan snapshot ke seluruh riwayat jadwal.
      // Riwayat lama tetap dipertahankan.
      await client.query(
        `UPDATE schedule_histories
         SET schedule_snapshot = $1::jsonb
         WHERE schedule_id = $2`,
        [
          JSON.stringify(snapshot),
          scheduleId
        ]
      );

      // Hapus peserta jadwal.
      await client.query(
        `DELETE FROM schedule_participants
         WHERE schedule_id = $1`,
        [scheduleId]
      );

      // Hapus jadwal.
      // Foreign key SET NULL akan memutus relasi riwayat
      // tanpa menghapus catatan aktivitasnya.
      await client.query(
        `DELETE FROM schedules
         WHERE id = $1`,
        [scheduleId]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Jadwal arsip berhasil dihapus permanen. Riwayat aktivitas tetap tersimpan.'
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (e) {
          console.error('Rollback Permanent Delete Error:', e.message);
        }
      }

      console.error('Delete Archived Schedule Error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }

      if (error.code === '40001') {
        return res.status(409).json({
          success: false,
          message: 'Terjadi perubahan bersamaan. Silakan coba kembali.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus jadwal arsip.'
      });

    } finally {
      if (client) client.release();
    }
  }
};

module.exports = ScheduleController;


