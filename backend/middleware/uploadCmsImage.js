const multer = require('multer');
const path = require('path');

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

const uploadCmsImage = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1000 * 1000,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

        if (
            !allowedMimeTypes.includes(file.mimetype) ||
            !validExtensions.includes(extension)
        ) {
            const error = new Error(
                'Format gambar harus JPG, JPEG, PNG, atau WEBP.'
            );
            error.statusCode = 400;
            return cb(error);
        }

        cb(null, true);
    }
});

const verifyCmsImage = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const buffer = req.file.buffer;

        if (!Buffer.isBuffer(buffer)) {
            const error = new Error('Buffer gambar tidak valid.');
            error.statusCode = 400;
            return next(error);
        }

        const isJpeg =
            buffer.length >= 3 &&
            buffer[0] === 0xFF &&
            buffer[1] === 0xD8 &&
            buffer[2] === 0xFF;

        const isPng =
            buffer.length >= 8 &&
            buffer.subarray(0, 8).equals(
                Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            );

        const isWebp =
            buffer.length >= 12 &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP';

        const valid =
            (req.file.mimetype === 'image/jpeg' && isJpeg) ||
            (req.file.mimetype === 'image/png' && isPng) ||
            (req.file.mimetype === 'image/webp' && isWebp);

        if (!valid) {
            const error = new Error(
                'Isi file tidak sesuai dengan format gambar yang diizinkan.'
            );
            error.statusCode = 400;
            return next(error);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadCmsImage,
    verifyCmsImage
};
