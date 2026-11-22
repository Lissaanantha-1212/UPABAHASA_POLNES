const crypto = require('crypto');
const db = require('../config/db.pg');
const supabaseAuth = require('../config/supabaseAuth');

const hashCode = (code) =>
    crypto.createHash('sha256').update(code).digest('hex');

const generateCode = () =>
    crypto.randomBytes(12).toString('hex').toUpperCase();

const nameFromEmail = (email) => {
    const localPart = email.split('@')[0];

    const name = localPart
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    return name || 'Admin UPA';
};

const createAuditLog = async (client, admin, action, description, newData) => {
    await client.query(
        `INSERT INTO public.admin_activity_logs
            (admin_profile_id, actor_name, actor_role, module,
             action, target_type, target_id, description,
             new_data, result)
         VALUES ($1, $2, $3, 'auth', $4, 'admin_profile',
                 $5, $6, $7::jsonb, 'success')`,
        [
            admin.id,
            admin.full_name,
            admin.role,
            action,
            String(admin.id),
            description,
            JSON.stringify(newData)
        ]
    );
};

const AdminRegistrationController = {

    // Membuat kode pertama. Hanya dapat dilakukan saat belum ada admin.
    bootstrapCode: async (req, res) => {
        const expectedSecret =
            process.env.ADMIN_REGISTRATION_BOOTSTRAP_SECRET;

        const suppliedSecret =
            String(req.get('x-bootstrap-secret') || '');

        if (!expectedSecret || expectedSecret.length < 32) {
            return res.status(503).json({
                success: false,
                message: 'Bootstrap registrasi belum dikonfigurasi.'
            });
        }

        const suppliedBuffer = Buffer.from(suppliedSecret);
        const expectedBuffer = Buffer.from(expectedSecret);

        if (
            suppliedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Akses bootstrap ditolak.'
            });
        }

        let client;

        try {
            client = await db.connect();
            await client.query('BEGIN');

            // Mencegah dua bootstrap berjalan bersamaan.
            await client.query(
                "SELECT pg_advisory_xact_lock(hashtext('epd1_admin_bootstrap'))"
            );

            const profiles = await client.query(
                'SELECT COUNT(*)::int AS total FROM public.admin_profiles'
            );

            if (profiles.rows[0].total > 0) {
                await client.query('ROLLBACK');

                return res.status(409).json({
                    success: false,
                    message: 'Bootstrap hanya tersedia sebelum admin pertama dibuat.'
                });
            }

            const existingCode = await client.query(
                `SELECT id
                 FROM public.admin_registration_codes
                 WHERE used_at IS NULL
                   AND revoked_at IS NULL
                   AND expires_at > NOW()
                 LIMIT 1`
            );

            if (existingCode.rows.length > 0) {
                await client.query('ROLLBACK');

                return res.status(409).json({
                    success: false,
                    message: 'Kode bootstrap yang masih berlaku sudah tersedia.'
                });
            }

            const code = generateCode();

            await client.query(
                `INSERT INTO public.admin_registration_codes
                    (code_hash, expires_at)
                 VALUES ($1, NOW() + INTERVAL '30 minutes')`,
                [hashCode(code)]
            );

            await client.query('COMMIT');

            return res.status(201).json({
                success: true,
                message: 'Kode bootstrap berhasil dibuat. Simpan kode ini dengan aman.',
                data: { code, expiresInMinutes: 30 }
            });

        } catch (error) {
            if (client) {
                await client.query('ROLLBACK').catch(() => {});
            }

            console.error('Bootstrap registration error:', error.message);

            return res.status(500).json({
                success: false,
                message: 'Gagal membuat kode bootstrap.'
            });

        } finally {
            client?.release();
        }
    },

    // Admin aktif membuat kode untuk pendaftar berikutnya.
    createCode: async (req, res) => {
        if (req.user?.authType !== 'supabase') {
            return res.status(403).json({
                success: false,
                message: 'Gunakan akun admin Supabase untuk membuat kode.'
            });
        }

        const code = generateCode();

        try {
            await db.query(
                `INSERT INTO public.admin_registration_codes
                    (code_hash, created_by_admin_id, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
                [hashCode(code), req.user.adminProfileId]
            );

            return res.status(201).json({
                success: true,
                message: 'Kode registrasi berhasil dibuat.',
                data: { code, expiresInHours: 24 }
            });

        } catch (error) {
            console.error('Create registration code error:', error.message);

            return res.status(500).json({
                success: false,
                message: 'Gagal membuat kode registrasi.'
            });
        }
    },

    // Registrasi publik dengan kode sekali pakai.
    register: async (req, res) => {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const code = String(req.body.code || '').trim().toUpperCase();

        if (!email || !password || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, dan kode registrasi wajib diisi.'
            });
        }

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Format email tidak valid.'
            });
        }

        if (password.length < 12 || password.length > 128) {
            return res.status(400).json({
                success: false,
                message: 'Password harus terdiri dari 12 sampai 128 karakter.'
            });
        }

        if (!/^[A-F0-9]{24}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'Kode registrasi tidak valid.'
            });
        }

        let client;
        let authUserId = null;
        let commitAttempted = false;
        let transactionStarted = false;

        try {
            client = await db.connect();
            await client.query('BEGIN');
            transactionStarted = true;

            // Pemakaian kode dilakukan secara atomik.
            const codeResult = await client.query(
                `UPDATE public.admin_registration_codes
                 SET used_at = NOW()
                 WHERE code_hash = $1
                   AND used_at IS NULL
                   AND revoked_at IS NULL
                   AND expires_at > NOW()
                 RETURNING id`,
                [hashCode(code)]
            );

            if (codeResult.rows.length === 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: 'Kode registrasi tidak valid, kedaluwarsa, atau sudah digunakan.'
                });
            }

            // Buat akun login melalui Supabase Auth.
            const { data, error } =
                await supabaseAuth.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true
                });

            if (error || !data?.user) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(409).json({
                    success: false,
                    message: 'Akun tidak dapat dibuat. Periksa email atau coba alamat lain.'
                });
            }

            authUserId = data.user.id;

            // Semua akun memakai nilai internal staf sesuai constraint DB.
            const profileResult = await client.query(
                `INSERT INTO public.admin_profiles
                    (auth_user_id, full_name, email, role,
                     staff_number, is_active)
                 VALUES (
                    $1, $2, $3, 'staf',
                    nextval('public.admin_staff_number_seq'),
                    true
                 )
                 RETURNING id, full_name, email, role,
                           staff_number, is_active`,
                [
                    authUserId,
                    nameFromEmail(email),
                    email
                ]
            );

            const admin = profileResult.rows[0];

            await createAuditLog(
                client,
                admin,
                'register',
                'Akun admin berhasil didaftarkan.',
                {
                    email: admin.email,
                    staffNumber: admin.staff_number
                }
            );

            commitAttempted = true;
            await client.query('COMMIT');
            transactionStarted = false;

            // Auth user sudah memiliki profil. Jangan hapus.
            authUserId = null;

            return res.status(201).json({
                success: true,
                message: 'Pendaftaran berhasil. Silakan login.',
                data: {
                    user: {
                        id: admin.id,
                        fullName: admin.full_name,
                        email: admin.email,
                        staffNumber: admin.staff_number,
                        accountNumber: `Admin ${String(admin.staff_number).padStart(2, '0')}`
                    }
                }
            });

        } catch (error) {
            if (transactionStarted && client) {
                await client.query('ROLLBACK').catch(() => {});
            }

            // Jika transaksi gagal sebelum COMMIT dicoba,
            // bersihkan akun Auth agar tidak menjadi akun yatim.
            if (authUserId && !commitAttempted) {
                const { error: deleteError } =
                    await supabaseAuth.auth.admin.deleteUser(authUserId);

                if (deleteError) {
                    console.error(
                        'PERLU REKONSILIASI: Auth user gagal dibersihkan:',
                        authUserId,
                        deleteError.message
                    );
                }
            }

            if (commitAttempted) {
                console.error(
                    'Hasil COMMIT perlu rekonsiliasi:',
                    authUserId,
                    error.message
                );
            } else {
                console.error('Admin registration error:', error.message);
            }

            return res.status(500).json({
                success: false,
                message: 'Pendaftaran gagal diproses. Silakan coba kembali.'
            });

        } finally {
            client?.release();
        }
    }
};

module.exports = AdminRegistrationController;
