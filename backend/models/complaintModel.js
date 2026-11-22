const db = require('../config/db');

const ComplaintModel = {
  // Fungsi untuk menyimpan pengaduan baru ke database
  create: async (complaintData) => {
    const { ticket_number, access_code, name, nim, major, category, description, attachment } = complaintData;
    
    const query = `
      INSERT INTO complaints (ticket_number, access_code, name, nim, major, category, description, attachment) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      ticket_number, access_code, name, nim, major, category, description, attachment
    ]);
    
    return result.insertId;
  },

  // Fungsi untuk mencari pengaduan berdasarkan Nomor Tiket DAN Kode Akses
  findByTicketAndCode: async (ticket_number, access_code) => {
    const query = `
      SELECT c.id, c.ticket_number, c.name, c.nim, c.major, c.category, c.description, c.attachment, c.status, c.created_at,
             (SELECT JSON_ARRAYAGG(JSON_OBJECT('old_status', ch.old_status, 'new_status', ch.new_status, 'admin_note', ch.admin_note, 'created_at', ch.created_at)) 
              FROM complaint_histories ch WHERE ch.complaint_id = c.id) as history
      FROM complaints c 
      WHERE c.ticket_number = ? AND c.access_code = ?
    `;
    
    const [rows] = await db.execute(query, [ticket_number, access_code]);
    return rows[0]; // Kembalikan data pertama yang cocok
  }
};

module.exports = ComplaintModel;