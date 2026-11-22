const crypto = require('crypto');
const db = require('../config/db.pg');
const storageService = require('../services/storageService');

const BUCKET = 'ebooks';

const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf'
};

// ======================================
// HELPER: VALIDASI PATH STORAGE
// ======================================
const isEbookStoragePath = (objectPath) => {
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
    ['covers', 'files'].includes(segments[0]) &&
    segments[1] !== '' &&
    segments[1] !== '.' &&
    segments[1] !== '..' &&
    /^[a-f0-9-]+\.(jpg|png|pdf)$/i.test(segments[1]) &&
    (
      (segments[0] === 'covers' && /\.(jpg|png)$/i.test(segments[1])) ||
      (segments[0] === 'files' && /\.pdf$/i.test(segments[1]))
    )
  );
};

// ======================================
// HELPER: VALIDASI FILE BERDASARKAN ISI
// ======================================
const validateEbookFile = (file, type) => {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Buffer file E-Book tidak valid.');
  }

  if (!MIME_EXTENSIONS[file.mimetype]) {
    throw new Error('Format file E-Book tidak didukung.');
  }

  if (type === 'cover') {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new Error('Format cover harus JPG, JPEG, atau PNG.');
    }

    const isJpeg =
      file.mimetype === 'image/jpeg' &&
      file.buffer.length >= 3 &&
      file.buffer[0] === 0xFF &&
      file.buffer[1] === 0xD8 &&
      file.buffer[2] === 0xFF;

    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4E, 0x47,
      0x0D, 0x0A, 0x1A, 0x0A
    ]);

    const isPng =
      file.mimetype === 'image/png' &&
      file.buffer.length >= 8 &&
      file.buffer.subarray(0, 8).equals(pngSignature);

    if (!isJpeg && !isPng) {
      throw new Error('Isi file cover tidak sesuai dengan format gambar.');
    }

    return;
  }

  if (type === 'pdf') {
    if (
      file.mimetype !== 'application/pdf' ||
      file.buffer.length < 5 ||
      file.buffer.subarray(0, 5).toString() !== '%PDF-'
    ) {
      throw new Error('Isi file E-Book tidak sesuai dengan format PDF.');
    }
  }
};

// ======================================
// HELPER: UPLOAD FILE KE SUPABASE
// ======================================
const uploadEbookToStorage = async (file, folder, type) => {
  validateEbookFile(file, type);

  const extension = MIME_EXTENSIONS[file.mimetype];
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

// ======================================
// HELPER: FORMAT URL E-BOOK
// ======================================
const getEbookFileUrl = (filePath, req) => {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // URL yang sudah absolut tetap digunakan
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  // Path file lama tetap dapat diakses
  if (filePath.startsWith('uploads/ebooks/')) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
  }

  // Path objek baru di Supabase Storage
  if (isEbookStoragePath(filePath)) {
    return storageService.getPublicUrl(BUCKET, filePath);
  }

  return null;
};

const formatEbook = (ebook, req) => {
  return {
    ...ebook,
    cover: getEbookFileUrl(ebook.cover_image, req),
    fileUrl: ebook.file_path
      ? getEbookFileUrl(ebook.file_path, req)
      : ebook.external_link || null,
    accessType: ebook.file_path
      ? 'file'
      : ebook.external_link
        ? 'link'
        : null
  };
};

// ======================================
// HELPER: HAPUS STORAGE JIKA TIDAK DIREFERENSIKAN
// ======================================
const removeEbookStorageIfUnreferenced = async (objectPath) => {
  if (!isEbookStoragePath(objectPath)) {
    // Path lokal lama atau URL eksternal tidak dihapus
    return false;
  }

  try {
    const referenceResult = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM public.ebooks
       WHERE cover_image = $1
          OR file_path = $1`,
      [objectPath]
    );

    if (referenceResult.rows[0].total > 0) {
      console.log(
        `Objek E-Book masih digunakan, tidak dihapus: ${objectPath}`
      );
      return false;
    }

    await storageService.removeObject(BUCKET, objectPath);

    console.log(`Objek Storage E-Book berhasil dihapus: ${objectPath}`);
    return true;

  } catch (error) {
    console.error(
      `Gagal membersihkan objek Storage E-Book ${objectPath}:`,
      error.message
    );

    return false;
  }
};

// ======================================
// HELPER: BERSIHKAN BEBERAPA OBJEK STORAGE
// ======================================
const cleanupEbookStorageObjects = async (objectPaths) => {
  const uniquePaths = [
    ...new Set(objectPaths.filter(Boolean))
  ];

  for (const objectPath of uniquePaths) {
    await removeEbookStorageIfUnreferenced(objectPath);
  }
};

// ======================================
// GET: MENAMPILKAN SEMUA E-BOOK
// GET /api/ebooks
// ======================================
exports.getAllEbooks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        id,
        title,
        author,
        category,
        description,
        cover_image,
        file_path,
        external_link,
        created_at,
        updated_at
      FROM public.ebooks
      ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      message: 'Data E-Book berhasil diambil.',
      data: result.rows.map((ebook) => formatEbook(ebook, req))
    });

  } catch (error) {
    console.error('Get E-Books Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data E-Book.'
    });
  }
};

// ======================================
// GET: MENAMPILKAN DETAIL E-BOOK
// GET /api/ebooks/:id
// ======================================
exports.getEbookById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM public.ebooks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Book tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Detail E-Book berhasil diambil.',
      data: formatEbook(result.rows[0], req)
    });

  } catch (error) {
    console.error('Get Ebook Detail Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail E-Book.'
    });
  }
};

// ======================================
// POST: TAMBAH E-BOOK
// POST /api/ebooks
// ======================================
exports.createEbook = async (req, res) => {
  const uploadedObjects = [];

  try {
    const {
      title,
      author,
      category,
      description,
      external_link
    } = req.body;

    const coverFile = req.files?.cover?.[0];
    const ebookFile = req.files?.ebookFile?.[0];

    if (!title?.trim() || !author?.trim() || !category?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Judul, penulis, dan kategori wajib diisi.'
      });
    }

    if (!ebookFile && !external_link?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Upload file PDF atau masukkan tautan E-Book.'
      });
    }

    if (ebookFile && external_link?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pilih salah satu akses: file PDF atau tautan eksternal.'
      });
    }

    let coverPath = null;
    let filePath = null;

    if (coverFile) {
      coverPath = await uploadEbookToStorage(
        coverFile,
        'covers',
        'cover'
      );

      uploadedObjects.push(coverPath);
    }

    if (ebookFile) {
      filePath = await uploadEbookToStorage(
        ebookFile,
        'files',
        'pdf'
      );

      uploadedObjects.push(filePath);
    }

    const result = await db.query(
      `INSERT INTO public.ebooks
        (title, author, category, description, cover_image, file_path, external_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title.trim(),
        author.trim(),
        category.trim(),
        description?.trim() || null,
        coverPath,
        filePath,
        external_link?.trim() || null
      ]
    );

    uploadedObjects.length = 0;

    return res.status(201).json({
      success: true,
      message: 'E-Book berhasil ditambahkan.',
      data: formatEbook(result.rows[0], req)
    });

  } catch (error) {
    console.error('Create Ebook Error:', error);

    await cleanupEbookStorageObjects(uploadedObjects);

    if (
      error.message?.includes('Format') ||
      error.message?.includes('Isi file') ||
      error.message?.includes('Buffer file')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan E-Book.'
    });
  }
};

// ======================================
// PUT: EDIT E-BOOK
// PUT /api/ebooks/:id
// ======================================
exports.updateEbook = async (req, res) => {
  const uploadedObjects = [];

  try {
    const { id } = req.params;

    const {
      title,
      author,
      category,
      description,
      external_link,
      accessType
    } = req.body;

    const existingResult = await db.query(
      'SELECT * FROM public.ebooks WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Book tidak ditemukan.'
      });
    }

    const existing = existingResult.rows[0];

    const coverFile = req.files?.cover?.[0];
    const ebookFile = req.files?.ebookFile?.[0];

    const newTitle = title?.trim() || existing.title;
    const newAuthor = author?.trim() || existing.author;
    const newCategory = category?.trim() || existing.category;

    const newDescription = description !== undefined
      ? (description.trim() || null)
      : existing.description;

    let newCover = existing.cover_image;
    let newFilePath = existing.file_path;
    let newExternalLink = existing.external_link;

    if (coverFile) {
      newCover = await uploadEbookToStorage(
        coverFile,
        'covers',
        'cover'
      );

      uploadedObjects.push(newCover);
    }

    if (accessType === 'file') {
      newExternalLink = null;

      if (ebookFile) {
        newFilePath = await uploadEbookToStorage(
          ebookFile,
          'files',
          'pdf'
        );

        uploadedObjects.push(newFilePath);

      } else if (!existing.file_path) {
        await cleanupEbookStorageObjects(uploadedObjects);

        return res.status(400).json({
          success: false,
          message: 'File PDF harus diunggah.'
        });
      }

    } else if (accessType === 'link') {
      if (!external_link?.trim()) {
        await cleanupEbookStorageObjects(uploadedObjects);

        return res.status(400).json({
          success: false,
          message: 'Tautan eksternal wajib diisi.'
        });
      }

      newFilePath = null;
      newExternalLink = external_link.trim();

    } else if (ebookFile) {
      newFilePath = await uploadEbookToStorage(
        ebookFile,
        'files',
        'pdf'
      );

      uploadedObjects.push(newFilePath);
      newExternalLink = null;

    } else if (external_link?.trim()) {
      newFilePath = null;
      newExternalLink = external_link.trim();
    }

    const updateResult = await db.query(
      `UPDATE public.ebooks SET
        title = $1,
        author = $2,
        category = $3,
        description = $4,
        cover_image = $5,
        file_path = $6,
        external_link = $7,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        newTitle,
        newAuthor,
        newCategory,
        newDescription,
        newCover,
        newFilePath,
        newExternalLink,
        id
      ]
    );

    if (updateResult.rows.length === 0) {
      await cleanupEbookStorageObjects(uploadedObjects);

      return res.status(404).json({
        success: false,
        message: 'E-Book tidak ditemukan.'
      });
    }

    const oldObjects = [];

    if (
      existing.cover_image &&
      existing.cover_image !== newCover
    ) {
      oldObjects.push(existing.cover_image);
    }

    if (
      existing.file_path &&
      existing.file_path !== newFilePath
    ) {
      oldObjects.push(existing.file_path);
    }

    uploadedObjects.length = 0;

    await cleanupEbookStorageObjects(oldObjects);

    return res.status(200).json({
      success: true,
      message: 'E-Book berhasil diperbarui.',
      data: formatEbook(updateResult.rows[0], req)
    });

  } catch (error) {
    console.error('Update Ebook Error:', error);

    await cleanupEbookStorageObjects(uploadedObjects);

    if (
      error.message?.includes('Format') ||
      error.message?.includes('Isi file') ||
      error.message?.includes('Buffer file')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui E-Book.'
    });
  }
};

// ======================================
// DELETE: HAPUS SATU E-BOOK
// DELETE /api/ebooks/:id
// ======================================
exports.deleteEbook = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM public.ebooks
       WHERE id = $1
       RETURNING id, cover_image, file_path`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Book tidak ditemukan.'
      });
    }

    await cleanupEbookStorageObjects([
      result.rows[0].cover_image,
      result.rows[0].file_path
    ]);

    return res.status(200).json({
      success: true,
      message: 'E-Book berhasil dihapus.'
    });

  } catch (error) {
    console.error('Delete Ebook Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus E-Book.'
    });
  }
};

// ======================================
// DELETE BULK: HAPUS BEBERAPA E-BOOK
// DELETE /api/ebooks/bulk
// BODY: { ids: [1, 2, 3] }
// ======================================
exports.deleteMultipleEbooks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every(
        (id) =>
          (
            typeof id === 'number' ||
            (typeof id === 'string' && id.trim() !== '')
          ) &&
          Number.isSafeInteger(Number(id)) &&
          Number(id) > 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'ID E-Book tidak valid.'
      });
    }

    const uniqueIds = [...new Set(ids.map(Number))];

    const result = await db.query(
      `DELETE FROM public.ebooks
       WHERE id = ANY($1::int[])
       RETURNING id, cover_image, file_path`,
      [uniqueIds]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'E-Book tidak ditemukan.'
      });
    }

    const objectsToCheck = result.rows.flatMap((ebook) => [
      ebook.cover_image,
      ebook.file_path
    ]);

    await cleanupEbookStorageObjects(objectsToCheck);

    return res.status(200).json({
      success: true,
      message: `${result.rowCount} E-Book berhasil dihapus.`,
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('Delete Multiple Ebooks Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus beberapa E-Book.'
    });
  }
};

