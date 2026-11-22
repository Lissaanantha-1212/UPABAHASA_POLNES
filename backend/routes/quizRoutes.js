const express = require('express');
const router = express.Router();

const multer = require('multer');

const quizAdminController = require('../controllers/quizAdminController');
const quizStudentController = require('../controllers/quizStudentController');
const quizSettingsController = require('../controllers/quizSettingsController');
const quizExcelController = require('../controllers/quizExcelController');

const {
    authenticateToken,
    authorizeAdmin
} = require('../middleware/authMiddleware');

// ======================================
// VALIDASI CONTROLLER
// ======================================

const requiredAdminHandlers = [
    'getListeningAudio',
    'getBankItems',
    'getPackageById',
    'getQuestionById',
    'createPackage',
    'updatePackage',
    'updatePackageStatus',
    'deletePackage',
    'createQuestion',
    'updateQuestion',
    'updateQuestionStatus',
    'deleteQuestion'
];

requiredAdminHandlers.forEach((name) => {
    if (typeof quizAdminController[name] !== 'function') {
        throw new Error(
            `Controller quizAdminController.${name} tidak ditemukan.`
        );
    }
});

if (
    typeof quizStudentController.startQuiz !== 'function' ||
    typeof quizStudentController.submitQuiz !== 'function'
) {
    throw new Error('Handler mahasiswa pada quizStudentController tidak lengkap.');
}

if (typeof quizSettingsController.getSettings !== 'function') {
    throw new Error('Handler getSettings tidak ditemukan.');
}

if (
    typeof quizExcelController.downloadTemplate !== 'function' ||
    typeof quizExcelController.importStandaloneQuestions !== 'function'
) {
    throw new Error('Handler Excel pada quizExcelController tidak lengkap.');
}

// ======================================
// UPLOAD AUDIO
// ======================================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/mp4',
        'audio/x-m4a'
    ];

    const allowedExtensions = ['.mp3', '.wav', '.m4a'];
    const extension = require('path')
        .extname(file.originalname)
        .toLowerCase();

    if (
        allowedExtensions.includes(extension) &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        return cb(null, true);
    }

    return cb(
        new Error('File audio harus berformat MP3, WAV, atau M4A.')
    );
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1000 * 1000
    }
});

// ======================================
// UPLOAD EXCEL SOAL
// ======================================

const excelFileFilter = (req, file, cb) => {
    const extension = require('path')
        .extname(file.originalname)
        .toLowerCase();

    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/octet-stream'
    ];

    if (
        extension === '.xlsx' &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        return cb(null, true);
    }

    const error = new Error(
        'File import Kuis harus berformat Excel XLSX.'
    );
    error.statusCode = 400;

    return cb(error);
};

const excelUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: excelFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// ======================================
// AUDIO LISTENING DARI STORAGE
// ======================================

router.get(
    '/bank/audio/listening',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.getListeningAudio
);

// ======================================
// BANK SOAL TERPADU
// ======================================

router.get(
    '/bank/items',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.getBankItems
);

// ======================================
// TEMPLATE DAN IMPORT EXCEL
// ======================================

router.get(
    '/bank/excel/template',
    authenticateToken,
    authorizeAdmin,
    quizExcelController.downloadTemplate
);

router.post(
    '/bank/questions/import',
    authenticateToken,
    authorizeAdmin,
    excelUpload.single('excelFile'),
    quizExcelController.importStandaloneQuestions
);

// ======================================
// DETAIL PAKET DAN SOAL
// ======================================

router.get(
    '/bank/packages/:id',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.getPackageById
);

router.get(
    '/bank/questions/:id',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.getQuestionById
);

// ======================================
// CRUD PAKET SOAL
// ======================================

router.post(
    '/bank/packages',
    authenticateToken,
    authorizeAdmin,
    upload.single('audioFile'),
    quizAdminController.createPackage
);

router.put(
    '/bank/packages/:id',
    authenticateToken,
    authorizeAdmin,
    upload.single('audioFile'),
    quizAdminController.updatePackage
);

router.patch(
    '/bank/packages/:id/status',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.updatePackageStatus
);

router.delete(
    '/bank/packages/:id',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.deletePackage
);

// ======================================
// CRUD SOAL MANDIRI
// ======================================

router.post(
    '/bank/questions',
    authenticateToken,
    authorizeAdmin,
    upload.single('audioFile'),
    quizAdminController.createQuestion
);

router.put(
    '/bank/questions/:id',
    authenticateToken,
    authorizeAdmin,
    upload.single('audioFile'),
    quizAdminController.updateQuestion
);

router.patch(
    '/bank/questions/:id/status',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.updateQuestionStatus
);

router.delete(
    '/bank/questions/:id',
    authenticateToken,
    authorizeAdmin,
    quizAdminController.deleteQuestion
);

// ======================================
// PENGATURAN KUIS (READ-ONLY)
// ======================================

router.get(
    '/bank/settings',
    authenticateToken,
    authorizeAdmin,
    quizSettingsController.getSettings
);

// ======================================
// ROUTES MAHASISWA (TANPA LOGIN)
// ======================================

router.post(
    '/student/start',
    quizStudentController.startQuiz
);

router.post(
    '/student/submit',
    quizStudentController.submitQuiz
);

module.exports = router;

