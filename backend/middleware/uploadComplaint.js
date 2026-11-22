const multer = require('multer');
const path = require('path');

const allowedTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf'
};

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMime = allowedTypes[extension];

  if (!expectedMime || file.mimetype !== expectedMime) {
    return cb(
      new Error('Format file harus JPG, PNG, atau PDF dengan tipe file yang sesuai.')
    );
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  }
});

const verifyComplaintFile = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const buffer = req.file.buffer;
    const extension = path.extname(req.file.originalname).toLowerCase();
    const expectedMime = allowedTypes[extension];

    if (!Buffer.isBuffer(buffer) || !expectedMime) {
      return res.status(400).json({
        message: 'File lampiran tidak valid.'
      });
    }

    let detectedMime = null;

    if (
      buffer.length >= 3 &&
      buffer[0] === 0xFF &&
      buffer[1] === 0xD8 &&
      buffer[2] === 0xFF
    ) {
      detectedMime = 'image/jpeg';
    } else if (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      )
    ) {
      detectedMime = 'image/png';
    } else if (
      buffer.length >= 5 &&
      buffer.subarray(0, 5).toString('ascii') === '%PDF-'
    ) {
      detectedMime = 'application/pdf';
    }

    if (!detectedMime || detectedMime !== expectedMime) {
      return res.status(400).json({
        message: 'Isi file tidak sesuai dengan format JPG, PNG, atau PDF yang diizinkan.'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

upload.verifyComplaintFile = verifyComplaintFile;

module.exports = upload;
