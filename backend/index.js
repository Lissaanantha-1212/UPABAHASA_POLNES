const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

// ======================================
// IMPORT DATABASE DAN ROUTES
// ======================================

const db = require('./config/db.pg');

const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
const majorRoutes = require('./routes/majorRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const ebookRoutes = require('./routes/ebookRoutes');
const quizRoutes = require('./routes/quizRoutes');
const nonTestProgramRoutes = require('./routes/nonTestProgramRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const cmsRoutes = require('./routes/cmsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ======================================
// MIDDLEWARE
// ======================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ======================================
// STATIC FILES
// ======================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ======================================
// ROUTE UTAMA
// ======================================

app.get('/', (req, res) => {
  res.send('UPA Bahasa API is running!');
});

// ======================================
// ROUTE TES KONEKSI DATABASE
// ======================================

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT 1 + 1 AS solution'
    );

    return res.status(200).json({
      success: true,
      message: 'Database connected successfully!',
      solution: result.rows[0].solution
    });

  } catch (error) {
    console.error('Database Connection Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed!'
    });
  }
});

// ======================================
// ROUTE PENGADUAN
// ======================================

app.use('/api/complaints', complaintRoutes);

// ======================================
// ROUTE ADMIN AUTH
// ======================================

app.use('/api/admin', authRoutes);

// ======================================
// ROUTE DATA PROGRAM STUDI
// ======================================

app.use('/api/majors', majorRoutes);

// ======================================
// ROUTE SURVEI KEPUASAN LAYANAN
// ======================================

app.use('/api/surveys', surveyRoutes);

app.get('/api/surveys/test', (req, res) => {
  res.json({
    success: true,
    message: 'Route survei berhasil terhubung!'
  });
});

// ======================================
// ROUTE MANAJEMEN E-BOOK
// ======================================

app.use('/api/ebooks', ebookRoutes);

// ======================================
// ROUTE MANAJEMEN KUIS
// ======================================

app.use('/api/quizzes', quizRoutes);

// ======================================
// ROUTE MANAJEMEN PROGRAM NON-TES
// ======================================

app.use('/api/non-test-programs', nonTestProgramRoutes);

// ======================================
// ROUTE PENDAFTARAN KURSUS NON-TES
// ======================================

app.use('/api/registrations', registrationRoutes);

// ======================================
// ROUTE MANAJEMEN JADWAL KURSUS NON-TES
// ======================================

app.use('/api/schedules', scheduleRoutes);
app.use('/api/cms', cmsRoutes);

// ======================================
// ROUTE TIDAK DITEMUKAN
// ======================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan.'
  });
});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

app.use((error, req, res, next) => {
  console.error('================================');
  console.error('GLOBAL ERROR:', error);
  console.error('ERROR MESSAGE:', error.message);
  console.error('ERROR TYPE:', error.type);
  console.error('ERROR CODE:', error.code);
  console.error('================================');

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Format data JSON tidak valid.'
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Ukuran file melebihi batas maksimal yang diizinkan.'
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  const allowedUploadErrors = [
    'Format cover harus JPG, JPEG, atau PNG.',
    'File E-Book harus berformat PDF.',
    'Jenis upload tidak dikenali.',
    'File audio harus berformat MP3, WAV, atau M4A.',
    'Format gambar harus JPG, JPEG, PNG, atau WEBP.',
    'Isi file tidak sesuai dengan format gambar yang diizinkan.'
  ];

  if (allowedUploadErrors.includes(error.message)) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.'
  });
});

// ======================================
// JALANKAN SERVER
// ======================================

const server = app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`Server berjalan di: http://localhost:${PORT}`);
  console.log(`Database: ${process.env.SUPABASE_DB_NAME || 'postgres'}`);
  console.log('Database driver: PostgreSQL');
  console.log('========================================\n');
});

// ======================================
// PENANGANAN SHUTDOWN
// ======================================

const shutdown = async () => {
  console.log('\nMenutup server...');

  server.close(async () => {
    try {
      await db.end();
      console.log('Koneksi database ditutup.');
      process.exit(0);
    } catch (error) {
      console.error('Gagal menutup koneksi database:', error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
