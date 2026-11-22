const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3307,  
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'upa_bahasa_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tes koneksi saat server dimulai
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ GAGAL KONEKSI DATABASE:');
        console.error('Port:', process.env.DB_PORT || 3307);
        console.error('Host:', process.env.DB_HOST || '127.0.0.1');
        console.error(err.message);
    } else {
        console.log('✅ Database berhasil terhubung!');
        console.log('Port MySQL:', process.env.DB_PORT || 3307);
        connection.release();
    }
});

module.exports = pool.promise();