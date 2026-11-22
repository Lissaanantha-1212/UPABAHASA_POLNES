
const express = require('express');
const router = express.Router();

const RegistrationController = require('../controllers/registrationController');

const {
  authenticateToken,
  authorizeAdmin
} = require('../middleware/authMiddleware');

// ======================================
// ROUTE MAHASISWA (TANPA LOGIN)
// ======================================

router.post(
  '/',
  RegistrationController.createRegistration
);

// ======================================
// ROUTE ADMIN DAN STAF (WAJIB LOGIN)
// ======================================

router.get(
  '/admin',
  authenticateToken,
  authorizeAdmin,
  RegistrationController.getAllRegistrations
);

router.patch(
  '/admin/:id/nim',
  authenticateToken,
  authorizeAdmin,
  RegistrationController.updateRegistrationNim
);

router.patch(
  '/admin/:id/verification',
  authenticateToken,
  authorizeAdmin,
  RegistrationController.updateRegistrationVerification
);

module.exports = router;

