const crypto = require('crypto');
const path = require('path');
const db = require('../config/db.pg');
const storageService = require('./storageService');

const BUCKET = 'complaint-attachments';
const SIGNED_URL_EXPIRY = 900;

const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf'
};

const ALLOWED_FOLDERS = ['complaints', 'additional'];

const isComplaintStoragePath = (objectPath) => {
  if (
    typeof objectPath !== 'string' ||
    !objectPath ||
    objectPath.startsWith('/') ||
    objectPath.includes('\\')
  ) {
    return false;
  }

  const segments = objectPath.split('/');

  return (
    segments.length === 2 &&
    ALLOWED_FOLDERS.includes(segments[0]) &&
    segments.every(
      (segment) =>
        segment &&
        segment !== '.' &&
        segment !== '..' &&
        path.basename(segment) === segment
    )
  );
};

const uploadComplaintFile = async (file, folder) => {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Buffer lampiran pengaduan tidak valid.');
  }

  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw new Error('Folder lampiran pengaduan tidak diizinkan.');
  }

  const extension = MIME_EXTENSIONS[file.mimetype];

  if (!extension) {
    throw new Error('Format lampiran pengaduan tidak didukung.');
  }

  const objectPath = `${folder}/${crypto.randomUUID()}${extension}`;

  await storageService.uploadObject({
    bucket: BUCKET,
    objectPath,
    fileBuffer: file.buffer,
    contentType: file.mimetype,
    upsert: false
  });

  return objectPath;
};

const getComplaintAttachmentUrl = async (storedPath) => {
  if (!storedPath || typeof storedPath !== 'string') {
    return null;
  }

  // URL lama atau URL eksternal tetap didukung.
  if (/^https?:\/\//i.test(storedPath)) {
    return storedPath;
  }

  // File lokal lama tidak dipindahkan atau diubah.
  if (
    storedPath.startsWith('uploads/complaints/') ||
    storedPath.startsWith('/uploads/complaints/')
  ) {
    return storedPath;
  }

  if (!isComplaintStoragePath(storedPath)) {
    return null;
  }

  return storageService.createSignedUrl(
    BUCKET,
    storedPath,
    SIGNED_URL_EXPIRY
  );
};

const removeComplaintStorageIfUnreferenced = async (objectPath) => {
  if (!isComplaintStoragePath(objectPath)) {
    return false;
  }

  try {
    const referenceResult = await db.query(
      `SELECT EXISTS (
        SELECT 1
        FROM public.complaints
        WHERE attachment = $1
           OR additional_attachment = $1
      ) AS is_referenced`,
      [objectPath]
    );

    if (referenceResult.rows[0]?.is_referenced) {
      return false;
    }

    await storageService.removeObject(BUCKET, objectPath);
    return true;
  } catch (error) {
    console.error(
      'Complaint Storage Cleanup Error:',
      error.message
    );
    return false;
  }
};

module.exports = {
  BUCKET,
  SIGNED_URL_EXPIRY,
  isComplaintStoragePath,
  uploadComplaintFile,
  getComplaintAttachmentUrl,
  removeComplaintStorageIfUnreferenced
};
