const express = require('express');
const router = express.Router();

const uploadComplaint = require('../middleware/uploadComplaint');

const {
  createComplaint,
  trackComplaint,
  submitAdditionalInfo
} = require('../controllers/complaintController');

const AdminComplaintController = require('../controllers/adminComplaintController');

const {
  authenticateToken,
  authorizeAdmin
} = require('../middleware/authMiddleware');

// MAHASISWA - TANPA LOGIN

router.post(
  '/',
  uploadComplaint.single('attachment'),
  uploadComplaint.verifyComplaintFile,
  createComplaint
);

router.post(
  '/track',
  trackComplaint
);

router.post(
  '/additional-info',
  uploadComplaint.single('attachment'),
  uploadComplaint.verifyComplaintFile,
  submitAdditionalInfo
);

// ADMIN / STAF - WAJIB LOGIN

router.get(
  '/admin',
  authenticateToken,
  authorizeAdmin,
  AdminComplaintController.getAllComplaints
);

router.get(
  '/admin/:id',
  authenticateToken,
  authorizeAdmin,
  AdminComplaintController.getComplaintDetail
);

router.patch(
  '/admin/:id/status',
  authenticateToken,
  authorizeAdmin,
  AdminComplaintController.updateComplaintStatus
);

router.delete(
  '/admin/:id',
  authenticateToken,
  authorizeAdmin,
  AdminComplaintController.deleteComplaint
);

module.exports = router;
