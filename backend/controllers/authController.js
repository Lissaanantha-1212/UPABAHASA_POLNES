const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db.pg');
const supabaseAuth = require('../config/supabaseAuth');

const AuthController = {

  // Login menggunakan Supabase Auth
  loginSupabase: async (req, res) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password wajib diisi.'
        });
      }

      const { data, error } =
        await supabaseAuth.auth.signInWithPassword({
          email,
          password
        });

      if (error || !data?.user || !data?.session) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah.'
        });
      }

      const profileResult = await db.query(
        'SELECT id, auth_user_id, full_name, email, role, staff_number, is_active ' +
        'FROM public.admin_profiles ' +
        'WHERE auth_user_id = $1 LIMIT 1',
        [data.user.id]
      );

      const admin = profileResult.rows[0];

      if (!admin || !admin.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun admin tidak aktif atau tidak memiliki akses.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        data: {
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          user: {
            id: admin.id,
            authUserId: admin.auth_user_id,
            fullName: admin.full_name,
            email: admin.email,
            role: admin.role,
            staffNumber: admin.staff_number
          }
        }
      });

    } catch (error) {
      console.error('Supabase Login Error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login.'
      });
    }
  },

  refreshSupabase: async (req, res) => {
    try {
      const refreshToken = String(req.body.refreshToken || '').trim();

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token wajib disertakan.'
        });
      }

      const { data, error } = await supabaseAuth.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data?.user || !data?.session) {
        return res.status(401).json({
          success: false,
          message: 'Sesi tidak dapat diperbarui. Silakan login kembali.'
        });
      }

      const profileResult = await db.query(
        `SELECT id, auth_user_id, full_name, email,
                role, staff_number, is_active
         FROM public.admin_profiles
         WHERE auth_user_id = $1
         LIMIT 1`,
        [data.user.id]
      );

      const admin = profileResult.rows[0];

      if (!admin || !admin.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun admin tidak aktif atau tidak memiliki akses.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Sesi berhasil diperbarui.',
        data: {
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          user: {
            id: admin.id,
            authUserId: admin.auth_user_id,
            fullName: admin.full_name,
            email: admin.email,
            role: admin.role,
            staffNumber: admin.staff_number
          }
        }
      });
    } catch (error) {
      console.error('Supabase Refresh Error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui sesi.'
      });
    }
  },

  getSession: async (req, res) => {
    if (req.user?.authType !== 'supabase') {
      return res.status(403).json({
        success: false,
        message: 'Sesi Supabase diperlukan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.adminProfileId,
          authUserId: req.user.authUserId,
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
          staffNumber: req.user.staffNumber
        }
      }
    });
  },
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validasi input
      if (!username || !password) {
        return res.status(400).json({
          message: 'Username dan password wajib diisi!'
        });
      }

      // Cari akun berdasarkan username atau email
      const result = await db.query(
        `SELECT id, username, email, password, role
         FROM public.users
         WHERE LOWER(username) = LOWER($1)
            OR LOWER(email) = LOWER($1)
         ORDER BY id ASC
         LIMIT 1`,
        [username]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          message: 'Username atau password salah!'
        });
      }

      // Periksa password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Username atau password salah!'
        });
      }

      // Hanya Admin dan Staf yang boleh masuk dashboard
      const allowedRoles = ['admin', 'staf'];

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: 'Akun ini tidak memiliki akses ke dashboard Admin.'
        });
      }

      // Periksa konfigurasi JWT
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET belum dikonfigurasi.');

        return res.status(500).json({
          message: 'Konfigurasi autentikasi server belum tersedia.'
        });
      }

      // Buat token login
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        }
      );

      // Kirim respons login
      return res.status(200).json({
        message: 'Login berhasil!',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Login Error:', error);

      return res.status(500).json({
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }
};

module.exports = AuthController;

