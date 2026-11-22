const express = require('express');
const router = express.Router();

const SurveyController = require('../controllers/surveyController');

const {
  authenticateToken,
  authorizeAdmin
} = require('../middleware/authMiddleware');

// ======================================
// MAHASISWA - DAFTAR ASPEK AKTIF
// ======================================
router.get(
  '/aspects',
  SurveyController.getActiveAspects
);

// ======================================
// MAHASISWA - KIRIM SURVEI TANPA LOGIN
// ======================================
router.post(
  '/',
  SurveyController.submitSurvey
);

// ======================================
// ADMIN / STAF - MANAJEMEN ASPEK
// ======================================
router.get(
  '/admin/aspects',
  authenticateToken,
  authorizeAdmin,
  SurveyController.getAdminAspects
);

router.post(
  '/admin/aspects',
  authenticateToken,
  authorizeAdmin,
  SurveyController.createAspect
);

router.put(
  '/admin/aspects/:id',
  authenticateToken,
  authorizeAdmin,
  SurveyController.updateAspect
);

router.delete(
  '/admin/aspects/:id',
  authenticateToken,
  authorizeAdmin,
  SurveyController.deleteAspect
);

// ======================================
// ADMIN / STAF - REKAP SURVEI
// ======================================
router.get(
  '/admin',
  authenticateToken,
  authorizeAdmin,
  SurveyController.getSurveySummary
);

// ======================================
// ADMIN / STAF - HAPUS TANGGAPAN
// ======================================
router.delete(
  '/admin',
  authenticateToken,
  authorizeAdmin,
  SurveyController.deleteSurveys
);

// ======================================
// ADMIN / STAF - EKSPOR EXCEL
// ======================================
router.get(
  '/admin/export',
  authenticateToken,
  authorizeAdmin,
  SurveyController.exportSurveyExcel
);

module.exports = router;
