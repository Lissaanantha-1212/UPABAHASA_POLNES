const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const AdminRegistrationController = require('../controllers/adminRegistrationController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// POST /api/admin/login
router.post('/login', AuthController.login);

// POST /api/admin/login-supabase
router.post('/login-supabase', AuthController.loginSupabase);
router.post('/refresh-supabase', AuthController.refreshSupabase);

router.get(
    '/session',
    authenticateToken,
    authorizeAdmin,
    AuthController.getSession
);

// Registrasi admin
router.post('/register/bootstrap-code', AdminRegistrationController.bootstrapCode);
router.post('/register', AdminRegistrationController.register);

router.post(
    '/register/codes',
    authenticateToken,
    authorizeAdmin,
    AdminRegistrationController.createCode
);
module.exports = router;

