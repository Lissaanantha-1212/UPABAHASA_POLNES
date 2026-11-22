const jwt = require('jsonwebtoken');
const db = require('../config/db.pg');
const supabaseAuth = require('../config/supabaseAuth');

// Mendeteksi token berdasarkan issuer.
// Ini hanya untuk menentukan jalur pemeriksaan, bukan untuk mengesahkan token.
const isSupabaseToken = (token) => {
    const decoded = jwt.decode(token);
    const issuer = decoded?.iss;
    const supabaseUrl = process.env.SUPABASE_URL;

    if (!issuer || !supabaseUrl) return false;

    const expectedIssuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;

    return issuer.replace(/\/+$/, '') === expectedIssuer;
};

const sendUnauthorized = (res) => {
    return res.status(401).json({
        message: 'Sesi autentikasi tidak valid atau telah kedaluwarsa.'
    });
};

const sendAuthServiceUnavailable = (res) => {
    return res.status(503).json({
        message: 'Layanan autentikasi sedang mengalami gangguan. Silakan coba lagi.'
    });
};

// Memeriksa token Supabase Auth atau JWT lama
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const match = authHeader?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return sendUnauthorized(res);
    }

    const token = match[1];

    // 1. Jalur khusus token Supabase
    if (isSupabaseToken(token)) {
        try {
            const { data, error } = await supabaseAuth.auth.getUser(token);

            if (error || !data?.user) {
                const status = Number(error?.status);

                // Respons 429 atau 5xx menunjukkan gangguan layanan,
                // bukan bukti bahwa sesi Admin sudah tidak berlaku.
                if (
                    status === 429 ||
                    status >= 500 ||
                    !status
                ) {
                    console.error(
                        'Layanan Supabase Auth bermasalah:',
                        error?.message || 'Tidak ada detail error'
                    );

                    return sendAuthServiceUnavailable(res);
                }

                // Token ditolak oleh Supabase.
                return sendUnauthorized(res);
            }

            let result;

            try {
                result = await db.query(
                    `SELECT id, auth_user_id, full_name, email,
                            role, staff_number, is_active
                     FROM public.admin_profiles
                     WHERE auth_user_id = $1
                     LIMIT 1`,
                    [data.user.id]
                );
            } catch (dbError) {
                console.error(
                    'Gagal memeriksa profil admin:',
                    dbError
                );

                return res.status(500).json({
                    message: 'Gagal memeriksa status akun Admin.'
                });
            }

            const admin = result.rows[0];

            if (!admin || !admin.is_active) {
                return res.status(403).json({
                    message: 'Akun Admin tidak aktif atau tidak memiliki akses.'
                });
            }

            req.user = {
                id: admin.id,
                adminProfileId: admin.id,
                authUserId: admin.auth_user_id,
                fullName: admin.full_name,
                email: admin.email,
                role: admin.role,
                staffNumber: admin.staff_number,
                authType: 'supabase'
            };

            return next();
        } catch (error) {
            console.error(
                'Gagal menghubungi Supabase Auth:',
                error.message
            );

            return sendAuthServiceUnavailable(res);
        }
    }

    // 2. Jalur kompatibilitas JWT lama
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error('JWT_SECRET belum dikonfigurasi.');

        return res.status(500).json({
            message: 'Konfigurasi autentikasi server belum tersedia.'
        });
    }

    try {
        const user = jwt.verify(token, secret);

        if (!user || typeof user !== 'object') {
            return sendUnauthorized(res);
        }

        req.user = {
            ...user,
            authType: 'legacy_jwt'
        };

        return next();
    } catch (error) {
        return sendUnauthorized(res);
    }
};

// Admin dan staf memiliki hak akses yang sama
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: 'Autentikasi diperlukan.'
        });
    }

    const allowedRoles = [
        'admin',
        'kepala_upa',
        'staf'
    ];

    const userRole = String(req.user.role || '').toLowerCase();

    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
            message: 'Akses ditolak. Kamu tidak memiliki hak akses Admin.'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin
};
