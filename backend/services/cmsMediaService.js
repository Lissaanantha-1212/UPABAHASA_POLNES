const crypto = require('crypto');
const path = require('path');
const storageService = require('./storageService');

const BUCKET = 'cms-media';

const ALLOWED_FOLDERS = [
    'posts',
    'galleries',
    'hero-backgrounds',
    'members',
    'head-history',
    'about-profiles',
    'site-settings'
];

const MIME_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

const isLegacyCmsPath = (value) => {
    return typeof value === 'string' &&
        value.startsWith('/uploads/cms/');
};

const isValidObjectPath = (objectPath) => {
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
        segments.every((segment) =>
            segment &&
            segment !== '.' &&
            segment !== '..'
        )
    );
};

const uploadCmsImageToStorage = async (file, folder) => {
    if (!file || !Buffer.isBuffer(file.buffer)) {
        throw new Error('File gambar CMS tidak memiliki buffer yang valid.');
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
        throw new Error('Folder gambar CMS tidak diizinkan.');
    }

    const extension = MIME_EXTENSIONS[file.mimetype];

    if (!extension) {
        throw new Error('Format gambar CMS tidak didukung.');
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

const getCmsImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') {
        return null;
    }

    // URL yang sudah lengkap tidak perlu diubah.
    if (/^https?:\/\//i.test(imagePath)) {
        return imagePath;
    }

    // File lokal lama tetap dilayani melalui backend selama migrasi.
    if (isLegacyCmsPath(imagePath)) {
        return imagePath;
    }

    if (!isValidObjectPath(imagePath)) {
        return null;
    }

    return storageService.getPublicUrl(BUCKET, imagePath);
};

const removeCmsStorageObject = async (objectPath) => {
    if (!isValidObjectPath(objectPath)) {
        throw new Error('Path objek gambar CMS tidak valid.');
    }

    return storageService.removeObject(BUCKET, objectPath);
};

module.exports = {
    BUCKET,
    isLegacyCmsPath,
    isValidObjectPath,
    uploadCmsImageToStorage,
    getCmsImageUrl,
    removeCmsStorageObject
};
