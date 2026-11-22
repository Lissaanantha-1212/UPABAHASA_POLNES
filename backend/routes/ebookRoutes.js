const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const {
  authenticateToken,
  authorizeAdmin
} = require('../middleware/authMiddleware');

const {
  getAllEbooks,
  getEbookById,
  createEbook,
  updateEbook,
  deleteEbook,
  deleteMultipleEbooks
} = require('../controllers/ebookController');

// ======================================
// KONFIGURASI MULTER MEMORY STORAGE
// File disimpan sementara di memory sebagai Buffer
// ======================================
const storage = multer.memoryStorage();

// ======================================
// FILTER FORMAT FILE
// ======================================
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'cover') {
    const allowedCover = [
      '.jpg',
      '.jpeg',
      '.png'
    ];

    if (
      allowedCover.includes(extension) &&
      ['image/jpeg', 'image/png'].includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    return cb(
      new Error('Format cover harus JPG, JPEG, atau PNG.')
    );
  }

  if (file.fieldname === 'ebookFile') {
    if (
      extension === '.pdf' &&
      file.mimetype === 'application/pdf'
    ) {
      return cb(null, true);
    }

    return cb(
      new Error('File E-Book harus berformat PDF.')
    );
  }

  return cb(new Error('Jenis upload tidak dikenali.'));
};

// ======================================
// KONFIGURASI UPLOAD
// Batas disamakan dengan bucket Supabase: 25 MB desimal
// ======================================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1000 * 1000
  }
});

// ======================================
// MIDDLEWARE UPLOAD
// ======================================
const uploadEbookFiles = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'ebookFile', maxCount: 1 }
]);

// ======================================
// ROUTES E-BOOK
// ======================================

// Menampilkan semua E-Book - PUBLIK
router.get('/', getAllEbooks);

// Menampilkan detail E-Book - PUBLIK
router.get('/:id', getEbookById);

// ======================================
// OPERASI ADMIN
// Wajib login sebagai Admin atau Staf
// ======================================

// Menambahkan E-Book
router.post(
  '/',
  authenticateToken,
  authorizeAdmin,
  uploadEbookFiles,
  createEbook
);

// Hapus banyak E-Book
// Harus sebelum route /:id
router.delete(
  '/bulk',
  authenticateToken,
  authorizeAdmin,
  deleteMultipleEbooks
);

// Mengedit E-Book
router.put(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  uploadEbookFiles,
  updateEbook
);

// Menghapus satu E-Book
router.delete(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  deleteEbook
);

module.exports = router;
