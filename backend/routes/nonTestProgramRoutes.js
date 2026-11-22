const express = require('express');
const router = express.Router();

const NonTestProgramController = require('../controllers/nonTestProgramController');

const {
  authenticateToken,
  authorizeAdmin
} = require('../middleware/authMiddleware');

// Data program dapat dibaca publik
router.get('/', NonTestProgramController.getAllPrograms);
router.get('/:id', NonTestProgramController.getProgramById);


// Perubahan informasi hanya untuk Admin dan Staf
router.put(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  NonTestProgramController.updateProgram
);

module.exports = router;
