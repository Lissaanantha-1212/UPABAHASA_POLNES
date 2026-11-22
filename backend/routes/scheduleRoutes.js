const express = require('express');
const router = express.Router();

const ScheduleController = require('../controllers/scheduleController');

const {
  authenticateToken,
  authorizeAdmin
} = require('../middleware/authMiddleware');

// ==========================================
// JADWAL PUBLIK
// ==========================================

router.get(
  '/',
  ScheduleController.getPublicSchedules
);

// Unduh jadwal dan daftar peserta publik.
router.get(
  '/download/:scheduleId',
  ScheduleController.downloadPublicSchedules
);

// ==========================================
// PENGELOLAAN JADWAL ADMIN
// ==========================================

router.get(
  '/admin',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.getAllSchedulesAdmin
);

router.get(
  '/archived/admin',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.getArchivedSchedulesAdmin
);

router.get(
  '/history/admin',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.getScheduleHistories
);
router.delete(
  '/history/admin',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.deleteSelectedScheduleHistories
);

// ==========================================
// PEMBUATAN DAN PERUBAHAN JADWAL
// ==========================================

router.post(
  '/batches',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.createScheduleBatch
);

router.put(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.updateSchedule
);

// ==========================================
// KUNCI DAN BUKA KUNCI JADWAL
// ==========================================

router.post(
  '/:id/lock',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.lockSchedule
);

router.post(
  '/:id/unlock',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.unlockSchedule
);

// ==========================================
// PUBLIKASI, ARSIP, DAN PEMULIHAN
// ==========================================

router.post(
  '/:id/publish',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.publishSchedule
);
router.post(
  '/:id/unpublish',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.unpublishSchedule
);


router.post(
  '/:id/archive',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.archiveSchedule
);

router.post(
  '/:id/restore',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.restoreSchedule
);

// ==========================================
// PENGHAPUSAN JADWAL
// ==========================================

router.delete(
  '/:id/draft',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.deleteDraftSchedule
);

router.delete(
  '/:id/archived',
  authenticateToken,
  authorizeAdmin,
  ScheduleController.deleteArchivedSchedule
);

module.exports = router;
