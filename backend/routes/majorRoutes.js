const express = require('express');
const router = express.Router();
const MajorController = require('../controllers/majorController');

// GET /api/majors
router.get('/', MajorController.getAllMajors);

module.exports = router;