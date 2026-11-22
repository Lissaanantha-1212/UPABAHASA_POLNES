const supabase = require('../config/supabaseStorage');

const PUBLIC_BUCKETS = [
    'cms-media',
    'ebooks',
    'quiz-audio'
];

const PRIVATE_BUCKETS = [
    'complaint-attachments'
];

const ALLOWED_BUCKETS = [
    ...PUBLIC_BUCKETS,
    ...PRIVATE_BUCKETS
];

const storageService = {
    async uploadObject({
        bucket,
        objectPath,
        fileBuffer,
        contentType,
        upsert = false
    }) {
        if (!ALLOWED_BUCKETS.includes(bucket)) {
            throw new Error('Bucket Storage tidak diizinkan.');
        }

        if (!objectPath || !Buffer.isBuffer(fileBuffer) || !contentType) {
            throw new Error('Path, buffer file, dan content type wajib diisi.');
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(objectPath, fileBuffer, {
                contentType,
                upsert
            });

        if (error) throw error;

        return data;
    },

    async listObjects(bucket, folderPath, {
        limit = 100,
        offset = 0
    } = {}) {
        if (!ALLOWED_BUCKETS.includes(bucket)) {
            throw new Error('Bucket Storage tidak diizinkan.');
        }

        if (!folderPath || typeof folderPath !== 'string') {
            throw new Error('Folder Storage wajib diisi.');
        }

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 1000 ||
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            throw new Error('Parameter pagination Storage tidak valid.');
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folderPath, {
                limit,
                offset,
                sortBy: {
                    column: 'created_at',
                    order: 'desc'
                }
            });

        if (error) throw error;

        return data || [];
    },

    getPublicUrl(bucket, objectPath) {
        if (!PUBLIC_BUCKETS.includes(bucket)) {
            throw new Error('Bucket ini tidak boleh menggunakan URL publik.');
        }

        if (!objectPath) {
            throw new Error('Path objek wajib diisi.');
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(objectPath);

        return data.publicUrl;
    },

    async createSignedUrl(bucket, objectPath, expiresIn = 60) {
        if (!PRIVATE_BUCKETS.includes(bucket)) {
            throw new Error('Signed URL hanya disediakan untuk bucket private.');
        }

        if (!objectPath) {
            throw new Error('Path objek wajib diisi.');
        }

        if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 3600) {
            throw new Error('Masa berlaku signed URL harus 1–3600 detik.');
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(objectPath, expiresIn);

        if (error) throw error;

        return data.signedUrl;
    },

    async removeObject(bucket, objectPath) {
        if (!ALLOWED_BUCKETS.includes(bucket)) {
            throw new Error('Bucket Storage tidak diizinkan.');
        }

        if (!objectPath) {
            throw new Error('Path objek wajib diisi.');
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([objectPath]);

        if (error) throw error;

        return data;
    }
};

module.exports = storageService;

