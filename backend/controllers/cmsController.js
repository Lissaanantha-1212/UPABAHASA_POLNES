const db = require('../config/db.pg');
const cmsMediaService = require('../services/cmsMediaService');



const serializeCmsRecord = (record, fileColumn) => {
    if (!record || !fileColumn || !record[fileColumn]) {
        return record;
    }

    return {
        ...record,
        [fileColumn]: cmsMediaService.getCmsImageUrl(record[fileColumn])
    };
};

const serializeSiteSetting = (setting) => {
    if (!setting) return setting;

    const imageKeys = [
        'beranda_profil_image',
        'tentang_profil_image'
    ];

    if (!imageKeys.includes(setting.setting_key)) {
        return setting;
    }

    return {
        ...setting,
        setting_value: cmsMediaService.getCmsImageUrl(
            setting.setting_value
        )
    };
};

const serializeSiteSettings = (settings) =>
    settings.map(serializeSiteSetting);
const removeCmsImageIfUnreferenced = async (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') {
        return false;
    }

    // File lokal lama dipertahankan selama masa migrasi.
    if (cmsMediaService.isLegacyCmsPath(imagePath)) {
        console.log('File CMS lokal lama dipertahankan:', imagePath);
        return false;
    }

    // Hanya object path CMS yang valid yang boleh dihapus.
    if (!cmsMediaService.isValidObjectPath(imagePath)) {
        return false;
    }

    try {
        const result = await db.query(
            'SELECT EXISTS (' +
            'SELECT 1 FROM posts WHERE image = $1 ' +
            'UNION ALL SELECT 1 FROM galleries WHERE image = $1 ' +
            'UNION ALL SELECT 1 FROM hero_backgrounds WHERE image_path = $1 ' +
            'UNION ALL SELECT 1 FROM organization_members WHERE photo = $1 ' +
            'UNION ALL SELECT 1 FROM head_history WHERE photo = $1 ' +
            'UNION ALL SELECT 1 FROM about_profiles WHERE image = $1 ' +
            'UNION ALL SELECT 1 FROM site_settings WHERE setting_value = $1' +
            ') AS is_referenced',
            [imagePath]
        );

        if (result.rows[0]?.is_referenced) {
            console.log('Object CMS dipertahankan karena masih digunakan:', imagePath);
            return false;
        }

        await cmsMediaService.removeCmsStorageObject(imagePath);

        console.log('Object CMS tidak lagi digunakan:', imagePath);
        return true;
    } catch (error) {
        console.error(
            'Pemeriksaan/penghapusan object CMS gagal. Object dipertahankan:',
            imagePath,
            error.message
        );

        return false;
    }
};
const handler = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error('CMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada layanan CMS.'
        });
    }
};

const makeCrud = ({
    table,
    columns,
    orderBy,
    fileColumn,
    fileFolder,
    required = [],
    defaults = {}
}) => {
    const selectAll = handler(async (req, res) => {
        const result = await db.query(
            `SELECT * FROM ${table} ORDER BY ${orderBy}`
        );

        res.json({
            success: true,
            data: result.rows.map((record) =>
                serializeCmsRecord(record, fileColumn)
            )
        });
    });

    const selectOne = handler(async (req, res) => {
        const result = await db.query(
            `SELECT * FROM ${table} WHERE id = $1`,
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan.'
            });
        }

        res.json({
            success: true,
            data: serializeCmsRecord(result.rows[0], fileColumn)
        });
    });

    const create = handler(async (req, res) => {
        const data = { ...defaults };

        for (const column of columns) {
            if (req.body[column] !== undefined) {
                data[column] = req.body[column];
            }
        }

        const missing = required.filter(
            (column) => data[column] === undefined ||
                data[column] === null ||
                data[column] === ''
        );

        if (missing.length) {
            return res.status(400).json({
                success: false,
                message: `Kolom wajib belum diisi: ${missing.join(', ')}`
            });
        }

        if (req.file && (!fileColumn || !fileFolder)) {
            return res.status(400).json({
                success: false,
                message: 'Upload gambar tidak dikonfigurasi untuk fitur ini.'
            });
        }

        let uploadedObjectPath = null;

        try {
            if (req.file) {
                uploadedObjectPath =
                    await cmsMediaService.uploadCmsImageToStorage(
                        req.file,
                        fileFolder
                    );

                data[fileColumn] = uploadedObjectPath;
            }

            const keys = Object.keys(data);

            if (!keys.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Tidak ada data yang dikirim.'
                });
            }

            const values = keys.map((key) => data[key]);
            const placeholders = keys.map(
                (_, index) => `$${index + 1}`
            );

            const result = await db.query(
                `INSERT INTO ${table} (${keys.join(', ')})
                 VALUES (${placeholders.join(', ')})
                 RETURNING *`,
                values
            );

            return res.status(201).json({
                success: true,
                message: 'Data berhasil ditambahkan.',
                data: serializeCmsRecord(result.rows[0], fileColumn)
            });
        } catch (error) {
            if (uploadedObjectPath) {
                await removeCmsImageIfUnreferenced(uploadedObjectPath);
            }

            throw error;
        }
    });

    const update = handler(async (req, res) => {
        const oldResult = await db.query(
            `SELECT * FROM ${table} WHERE id = $1`,
            [req.params.id]
        );

        if (!oldResult.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan.'
            });
        }

        const oldData = oldResult.rows[0];
        const data = {};

        for (const column of columns) {
            if (req.body[column] !== undefined) {
                data[column] = req.body[column];
            }
        }

        if (req.file && (!fileColumn || !fileFolder)) {
            return res.status(400).json({
                success: false,
                message: 'Upload gambar tidak dikonfigurasi untuk fitur ini.'
            });
        }

        if (!Object.keys(data).length && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada perubahan data.'
            });
        }

        let uploadedObjectPath = null;

        try {
            if (req.file) {
                uploadedObjectPath =
                    await cmsMediaService.uploadCmsImageToStorage(
                        req.file,
                        fileFolder
                    );

                data[fileColumn] = uploadedObjectPath;
            }

            const keys = Object.keys(data);
            const values = keys.map((key) => data[key]);
            const sets = keys.map(
                (key, index) => `${key} = $${index + 1}`
            );

            values.push(req.params.id);

            const result = await db.query(
                `UPDATE ${table}
                 SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $${values.length}
                 RETURNING *`,
                values
            );

            if (!result.rows.length) {
                if (uploadedObjectPath) {
                    await removeCmsImageIfUnreferenced(uploadedObjectPath);
                }

                return res.status(404).json({
                    success: false,
                    message: 'Data tidak ditemukan.'
                });
            }

            if (
                uploadedObjectPath &&
                fileColumn &&
                oldData[fileColumn] &&
                oldData[fileColumn] !== uploadedObjectPath
            ) {
                await removeCmsImageIfUnreferenced(oldData[fileColumn]);
            }

            return res.json({
                success: true,
                message: 'Data berhasil diperbarui.',
                data: serializeCmsRecord(result.rows[0], fileColumn)
            });
        } catch (error) {
            if (uploadedObjectPath) {
                await removeCmsImageIfUnreferenced(uploadedObjectPath);
            }

            throw error;
        }
    });

    const remove = handler(async (req, res) => {
        const result = await db.query(
            `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Data tidak ditemukan.'
            });
        }

        if (fileColumn) {
            await removeCmsImageIfUnreferenced(
                result.rows[0][fileColumn]
            );
        }

        res.json({
            success: true,
            message: 'Data berhasil dihapus.'
        });
    });

    return { selectAll, selectOne, create, update, remove };
};
const postsCrud = makeCrud({
    table: 'posts',
    fileFolder: 'posts',
    columns: [
        'title', 'slug', 'category', 'content_category',
        'summary', 'content'
    ],
    fileColumn: 'image',
    orderBy: 'created_at DESC',
    required: ['title', 'slug', 'category'],
    defaults: { status: 'draft' }
});

const faqsCrud = makeCrud({
    table: 'faqs',
    columns: ['category', 'question', 'answer', 'status', 'sort_order'],
    orderBy: 'sort_order ASC, id DESC',
    required: ['question', 'answer']
});

const galleriesCrud = makeCrud({
    table: 'galleries',
    fileFolder: 'galleries',
    columns: ['title', 'description', 'event_date'],
    fileColumn: 'image',
    orderBy: 'event_date DESC NULLS LAST, id DESC',
    required: ['title'],
    defaults: { status: 'draft' }
});


// Proteksi khusus Galeri: konten published wajib di-unpublish sebelum diedit/dihapus.
const updateGallery = handler(async (req, res) => {
    const current = await db.query(
        'SELECT status FROM galleries WHERE id = $1',
        [req.params.id]
    );

    if (!current.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Dokumentasi tidak ditemukan.'
        });
    }

    if (current.rows[0].status === 'published') {
        return res.status(409).json({
            success: false,
            message: 'Unpublish dokumentasi terlebih dahulu sebelum mengedit.'
        });
    }

    return galleriesCrud.update(req, res);
});

const deleteGallery = handler(async (req, res) => {
    const result = await db.query(
        `DELETE FROM galleries
         WHERE id = $1 AND status = 'draft'
         RETURNING *`,
        [req.params.id]
    );

    if (!result.rows.length) {
        const exists = await db.query(
            'SELECT id FROM galleries WHERE id = $1',
            [req.params.id]
        );

        return res.status(exists.rows.length ? 409 : 404).json({
            success: false,
            message: exists.rows.length
                ? 'Unpublish dokumentasi terlebih dahulu sebelum menghapus.'
                : 'Dokumentasi tidak ditemukan.'
        });
    }

    await removeCmsImageIfUnreferenced(result.rows[0].image);

    res.json({
        success: true,
        message: 'Dokumentasi berhasil dihapus.'
    });
});

const updateGalleryStatus = handler(async (req, res) => {
    const { action } = req.body;

    if (!['publish', 'unpublish'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Aksi status tidak valid.'
        });
    }

    const status = action === 'publish' ? 'published' : 'draft';

    const result = await db.query(
        `UPDATE galleries
         SET status = $1::varchar,
             published_at = CASE
                 WHEN $1::varchar = 'published' AND status <> 'published'
                     THEN CURRENT_TIMESTAMP
                 ELSE published_at
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Dokumentasi tidak ditemukan.'
        });
    }

    res.json({
        success: true,
        message: action === 'publish'
            ? 'Dokumentasi berhasil dipublikasikan.'
            : 'Dokumentasi berhasil di-unpublish.',
        data: serializeCmsRecord(result.rows[0], 'image')
    });
});
const heroCrud = makeCrud({
    table: 'hero_backgrounds',
    fileFolder: 'hero-backgrounds',
    columns: ['page_name', 'overlay_color', 'is_active'],
    fileColumn: 'image_path',
    orderBy: 'id DESC',
    required: ['page_name']
});

const profilesCrud = makeCrud({
    table: 'about_profiles',
    columns: ['type', 'title', 'content'],
    fileColumn: 'image',
    fileFolder: 'about-profiles',
    orderBy: 'id ASC',
    required: ['type']
});

const aboutItemsCrud = makeCrud({
    table: 'about_list_items',
    columns: ['section_type', 'content', 'sort_order', 'is_active'],
    orderBy: 'sort_order ASC, id ASC',
    required: ['section_type', 'content']
});

const divisionsCrud = makeCrud({
    table: 'organization_divisions',
    columns: [
        'name', 'description', 'task_summary',
        'task_details', 'sort_order'
    ],
    orderBy: 'sort_order ASC, id ASC',
    required: ['name'],
    defaults: { is_active: false }
});

const membersCrud = makeCrud({
    table: 'organization_members',
    fileFolder: 'members',
    columns: [
        'section_name', 'name', 'description',
        'sort_order', 'is_active'
    ],
    fileColumn: 'photo',
    orderBy: 'sort_order ASC, id ASC',
    required: ['section_name', 'name'],
    defaults: { position: '' }
});

const updateDivision = divisionsCrud.update;

const deleteDivision = handler(async (req, res) => {
    const result = await db.query(
        `DELETE FROM organization_divisions AS d
         WHERE d.id = $1
           AND NOT EXISTS (
               SELECT 1 FROM organization_members AS m
               WHERE m.division_id = d.id
           )
         RETURNING *`,
        [req.params.id]
    );

    if (!result.rows.length) {
        const current = await db.query(
            'SELECT id FROM organization_divisions WHERE id = $1',
            [req.params.id]
        );

        return res.status(current.rows.length ? 409 : 404).json({
            success: false,
            message: current.rows.length
                ? 'Divisi tidak dapat dihapus karena masih memiliki personel.'
                : 'Divisi tidak ditemukan.'
        });
    }

    res.json({
        success: true,
        message: 'Divisi berhasil dihapus.'
    });
});
const updateDivisionStatus = handler(async (req, res) => {
    const { action } = req.body;

    if (!['publish', 'unpublish'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Aksi status tidak valid.'
        });
    }

    const isActive = action === 'publish';

    const result = await db.query(
        `UPDATE organization_divisions
         SET is_active = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        [isActive, req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Divisi tidak ditemukan.'
        });
    }

    res.json({
        success: true,
        message: isActive
            ? 'Divisi berhasil dipublikasikan.'
            : 'Divisi berhasil di-unpublish.',
        data: result.rows[0]
    });
});

const updateMember = handler(async (req, res) => {
    const current = await db.query(
        'SELECT is_active FROM organization_members WHERE id = $1',
        [req.params.id]
    );

    if (!current.rows.length) {

        return res.status(404).json({
            success: false,
            message: 'Personel tidak ditemukan.'
        });
    }

    if (current.rows[0].is_active) {

        return res.status(409).json({
            success: false,
            message: 'Unpublish personel terlebih dahulu sebelum mengedit.'
        });
    }

    return membersCrud.update(req, res);
});

const deleteMember = handler(async (req, res) => {
    const result = await db.query(
        `DELETE FROM organization_members
         WHERE id = $1 AND is_active = FALSE
         RETURNING *`,
        [req.params.id]
    );

    if (!result.rows.length) {
        const current = await db.query(
            'SELECT id, is_active FROM organization_members WHERE id = $1',
            [req.params.id]
        );

        if (!current.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Personel tidak ditemukan.'
            });
        }

        return res.status(409).json({
            success: false,
            message: 'Unpublish personel terlebih dahulu sebelum menghapus.'
        });
    }

    await removeCmsImageIfUnreferenced(result.rows[0].photo);

    res.json({
        success: true,
        message: 'Personel berhasil dihapus.'
    });
});

const unassignMember = handler(async (req, res) => {
    const result = await db.query(
        `UPDATE organization_members
         SET division_id = NULL,
             is_active = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Personel tidak ditemukan.'
        });
    }

    res.json({
        success: true,
        message: 'Personel berhasil dikeluarkan dari bagian dan disimpan sebagai Draft.',
        data: serializeCmsRecord(result.rows[0], 'photo')
    });
});
const updateMemberStatus = handler(async (req, res) => {
    const { action } = req.body;

    if (!['publish', 'unpublish'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Aksi status tidak valid.'
        });
    }

    const isActive = action === 'publish';

    const result = await db.query(
        `UPDATE organization_members
         SET is_active = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
           AND (
               $1 = FALSE
               OR (
                   section_name IS NOT NULL
                   AND BTRIM(section_name) <> ''
               )
           )
         RETURNING *`,
        [isActive, req.params.id]
    );

    if (!result.rows.length) {
        const existing = await db.query(
            'SELECT section_name FROM organization_members WHERE id = $1',
            [req.params.id]
        );

        if (!existing.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Personel tidak ditemukan.'
            });
        }

        if (
            isActive &&
            !String(existing.rows[0].section_name || '').trim()
        ) {
            return res.status(409).json({
                success: false,
                message: 'Bagian personel wajib diisi sebelum dipublikasikan.'
            });
        }

        return res.status(409).json({
            success: false,
            message: 'Status personel tidak dapat diperbarui. Silakan coba kembali.'
        });
    }

    res.json({
        success: true,
        message: isActive
            ? 'Personel berhasil dipublikasikan.'
            : 'Personel berhasil di-unpublish.',
        data: serializeCmsRecord(result.rows[0], 'photo')
    });
});

const historyCrud = makeCrud({
    table: 'head_history',
    fileFolder: 'head-history',
    columns: ['name', 'start_period', 'end_period', 'sort_order'],
    fileColumn: 'photo',
    orderBy: 'sort_order ASC, id ASC',
    required: ['name'],
    defaults: { is_active: false }
});

const updateHistory = handler(async (req, res) => {
    const current = await db.query(
        'SELECT is_active FROM head_history WHERE id = $1',
        [req.params.id]
    );

    if (!current.rows.length) {

        return res.status(404).json({
            success: false,
            message: 'Riwayat kepemimpinan tidak ditemukan.'
        });
    }

    if (current.rows[0].is_active) {

        return res.status(409).json({
            success: false,
            message: 'Unpublish riwayat kepemimpinan terlebih dahulu sebelum mengedit.'
        });
    }

    return historyCrud.update(req, res);
});

const deleteHistory = handler(async (req, res) => {
    const result = await db.query(
        `DELETE FROM head_history
         WHERE id = $1 AND is_active = FALSE
         RETURNING *`,
        [req.params.id]
    );

    if (!result.rows.length) {
        const current = await db.query(
            'SELECT id, is_active FROM head_history WHERE id = $1',
            [req.params.id]
        );

        if (!current.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Riwayat kepemimpinan tidak ditemukan.'
            });
        }

        return res.status(409).json({
            success: false,
            message: 'Unpublish riwayat kepemimpinan terlebih dahulu sebelum menghapus.'
        });
    }

    await removeCmsImageIfUnreferenced(result.rows[0].photo);

    res.json({
        success: true,
        message: 'Riwayat kepemimpinan berhasil dihapus.'
    });
});

const updateHistoryStatus = handler(async (req, res) => {
    const { action } = req.body;

    if (!['publish', 'unpublish'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Aksi status tidak valid.'
        });
    }

    const isActive = action === 'publish';

    const result = await db.query(
        `UPDATE head_history
         SET is_active = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [isActive, req.params.id]
    );

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Riwayat kepemimpinan tidak ditemukan.'
        });
    }

    res.json({
        success: true,
        message: isActive
            ? 'Riwayat kepemimpinan berhasil dipublikasikan.'
            : 'Riwayat kepemimpinan berhasil di-unpublish.',
        data: serializeCmsRecord(result.rows[0], 'photo')
    });
});

const getHomeContent = handler(async (req, res) => {
    const [hero, settings, galleries] = await Promise.all([
        db.query(
            `SELECT * FROM hero_backgrounds
             WHERE page_name = 'home'
               AND is_active = TRUE
             ORDER BY id DESC LIMIT 1`
        ),
        db.query(
            'SELECT setting_key, setting_value, setting_type FROM site_settings'
        ),
        db.query(
            `SELECT * FROM galleries
             WHERE status = 'published'
             ORDER BY event_date DESC NULLS LAST, id DESC`
        )
    ]);

    const settingsRows = settings.rows;
    const selectedSetting = settingsRows.find(
        (item) => item.setting_key === 'beranda_berita_pilihan'
    );

    let selectedPostIds = null;

    if (selectedSetting) {
        try {
            const parsed = JSON.parse(selectedSetting.setting_value || '[]');

            if (Array.isArray(parsed)) {
                selectedPostIds = [
                    ...new Set(
                        parsed
                            .map(Number)
                            .filter((id) => Number.isSafeInteger(id) && id > 0)
                    )
                ];
            }
        } catch (error) {
            console.error('Pengaturan berita pilihan tidak valid:', error);
        }
    }

    let postsRows = [];

    if (selectedPostIds === null) {
        const posts = await db.query(
            `SELECT * FROM posts
             WHERE status = 'published'
             ORDER BY COALESCE(published_at, created_at) DESC
             LIMIT 3`
        );

        postsRows = posts.rows;
    } else if (selectedPostIds.length > 0) {
        const posts = await db.query(
            `SELECT * FROM posts
             WHERE status = 'published'
               AND id = ANY($1::int[])
             ORDER BY array_position($1::int[], id)`,
            [selectedPostIds]
        );

        postsRows = posts.rows;
    }

    const selectedGallerySetting = settingsRows.find(
        (item) => item.setting_key === 'beranda_galeri_pilihan'
    );

    let selectedGalleryIds = null;

    if (selectedGallerySetting) {
        try {
            const parsed = JSON.parse(
                selectedGallerySetting.setting_value || '[]'
            );

            if (Array.isArray(parsed)) {
                selectedGalleryIds = [
                    ...new Set(
                        parsed
                            .map(Number)
                            .filter((id) => Number.isSafeInteger(id) && id > 0)
                    )
                ];
            }
        } catch (error) {
            console.error('Pengaturan galeri pilihan tidak valid:', error);
        }
    }

    const publishedGalleries = galleries.rows;
    const galleryRows = selectedGalleryIds === null
        ? publishedGalleries.slice(0, 3)
        : selectedGalleryIds
            .map((id) => publishedGalleries.find(
                (gallery) => Number(gallery.id) === id
            ))
            .filter(Boolean);
    res.json({
        success: true,
        data: {
            hero: serializeCmsRecord(hero.rows[0] || null, 'image_path'),
            settings: serializeSiteSettings(settingsRows),
            posts: postsRows.map((record) => serializeCmsRecord(record, 'image')),
            galleries: galleryRows.map((record) => serializeCmsRecord(record, 'image'))
        }
    });
});

const getAboutContent = handler(async (req, res) => {
    const [
        hero, profiles, items, divisions, members, history, settings
    ] = await Promise.all([
        db.query(
            `SELECT * FROM hero_backgrounds
             WHERE page_name = 'about'
               AND is_active = TRUE
             ORDER BY id DESC LIMIT 1`
        ),
        db.query('SELECT * FROM about_profiles ORDER BY id ASC'),
        db.query(
            `SELECT * FROM about_list_items
             WHERE is_active = TRUE
             ORDER BY sort_order ASC, id ASC`
        ),
        db.query(
            `SELECT * FROM organization_divisions
             ORDER BY sort_order ASC, id ASC`
        ),
        db.query(
            `SELECT * FROM organization_members
             WHERE is_active = TRUE
             ORDER BY sort_order ASC, id ASC`
        ),
        db.query(
            `SELECT * FROM head_history
             WHERE is_active = TRUE
             ORDER BY sort_order ASC, id ASC`
        ),
        db.query(
            `SELECT setting_key, setting_value, setting_type
             FROM site_settings`
        )
    ]);

    res.json({
        success: true,
        data: {
            hero: serializeCmsRecord(hero.rows[0] || null, 'image_path'),
            profiles: profiles.rows.map((record) => serializeCmsRecord(record, 'image')),
            items: items.rows,
            divisions: divisions.rows,
            members: members.rows.map((record) => serializeCmsRecord(record, 'photo')),
            history: history.rows.map((record) => serializeCmsRecord(record, 'photo')),
            settings: serializeSiteSettings(settings.rows)
        }
    });
});

const getPublicPosts = handler(async (req, res) => {
    const values = ['published'];
    let condition = "WHERE status = $1";

    if (req.query.category) {
        values.push(req.query.category);
        condition += ` AND category = $${values.length}`;
    }

    const result = await db.query(
        `SELECT * FROM posts ${condition}
         ORDER BY COALESCE(published_at, created_at) DESC`,
        values
    );

    res.json({
        success: true,
        data: result.rows.map((record) => serializeCmsRecord(record, 'image'))
    });
});

const getPublicPostBySlug = handler(async (req, res) => {
    const result = await db.query(
        `SELECT * FROM posts
         WHERE slug = $1 AND status = 'published'
         LIMIT 1`,
        [req.params.slug]
    );

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Konten tidak tersedia atau sudah tidak dipublikasikan.'
        });
    }

    res.json({
        success: true,
        data: serializeCmsRecord(result.rows[0], 'image')
    });
});

const updatePostStatus = handler(async (req, res) => {
    const { action } = req.body;

    if (!['publish', 'unpublish'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'Aksi status tidak valid.'
        });
    }

    let result;

    if (action === 'publish') {
        result = await db.query(
            `UPDATE posts
             SET status = 'published',
                 published_at = CASE
                     WHEN status = 'published' THEN published_at
                     ELSE CURRENT_TIMESTAMP
                 END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [req.params.id]
        );
    } else {
        result = await db.query(
            `UPDATE posts
             SET status = 'draft',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [req.params.id]
        );
    }

    if (!result.rows.length) {
        return res.status(404).json({
            success: false,
            message: 'Konten tidak ditemukan.'
        });
    }

    res.json({
        success: true,
        message: action === 'publish'
            ? 'Konten berhasil dipublikasikan.'
            : 'Konten berhasil di-unpublish.',
        data: serializeCmsRecord(result.rows[0], 'image')
    });
});
const getPublicFaqs = handler(async (req, res) => {
    const result = await db.query(
        `SELECT * FROM faqs
         WHERE status = 'published'
         ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: result.rows });
});

const getPublicGalleries = handler(async (req, res) => {
    const result = await db.query(
        `SELECT * FROM galleries WHERE status = 'published' ORDER BY event_date DESC NULLS LAST, id DESC`
    );
    res.json({
        success: true,
        data: result.rows.map((record) => serializeCmsRecord(record, 'image'))
    });
});

const getSiteSettings = handler(async (req, res) => {
    const result = await db.query(
        'SELECT * FROM site_settings ORDER BY setting_key ASC'
    );
    res.json({ success: true, data: serializeSiteSettings(result.rows) });
});

const saveSiteSetting = handler(async (req, res) => {
    const { setting_key, setting_value, setting_type } = req.body;

    if (!setting_key) {
        return res.status(400).json({
            success: false,
            message: 'setting_key wajib diisi.'
        });
    }

    const oldResult = await db.query(
        'SELECT setting_value FROM site_settings WHERE setting_key = $1',
        [setting_key]
    );

    const oldValue = oldResult.rows[0]?.setting_value;

    const result = await db.query(
        'INSERT INTO site_settings (setting_key, setting_value, setting_type) ' +
        'VALUES ($1, $2, $3) ' +
        'ON CONFLICT (setting_key) DO UPDATE SET ' +
        'setting_value = EXCLUDED.setting_value, ' +
        'setting_type = EXCLUDED.setting_type, ' +
        'updated_at = CURRENT_TIMESTAMP RETURNING *',
        [setting_key, setting_value ?? null, setting_type ?? null]
    );

    if (oldValue && oldValue !== setting_value) {
        await removeCmsImageIfUnreferenced(oldValue);
    }

    res.json({
        success: true,
        message: 'Pengaturan berhasil disimpan.',
        data: serializeSiteSetting(result.rows[0])
    });
});

const uploadAboutProfileImage = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Pilih foto Profil Tentang terlebih dahulu.'
        });
    }

    let newImagePath = null;

    try {
        const oldResult = await db.query(
            'SELECT setting_value FROM site_settings WHERE setting_key = $1',
            ['tentang_profil_image']
        );

        newImagePath = await cmsMediaService.uploadCmsImageToStorage(
            req.file,
            'site-settings'
        );

        await db.query(
            'INSERT INTO site_settings (setting_key, setting_value, setting_type) ' +
            'VALUES ($1, $2, $3) ON CONFLICT (setting_key) DO UPDATE SET ' +
            'setting_value = EXCLUDED.setting_value, ' +
            'setting_type = EXCLUDED.setting_type, ' +
            'updated_at = CURRENT_TIMESTAMP',
            ['tentang_profil_image', newImagePath, 'image']
        );

        await removeCmsImageIfUnreferenced(
            oldResult.rows[0]?.setting_value
        );

        return res.status(200).json({
            success: true,
            message: 'Foto Profil Tentang berhasil diperbarui.',
            data: {
                image: cmsMediaService.getCmsImageUrl(newImagePath)
            }
        });
    } catch (error) {
        if (newImagePath) {
            await removeCmsImageIfUnreferenced(newImagePath);
        }

        next(error);
    }
};
const uploadProfileImage = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Pilih foto Profil Singkat terlebih dahulu.'
        });
    }

    let newImagePath = null;

    try {
        const oldResult = await db.query(
            'SELECT setting_value FROM site_settings WHERE setting_key = $1',
            ['beranda_profil_image']
        );

        newImagePath = await cmsMediaService.uploadCmsImageToStorage(
            req.file,
            'site-settings'
        );

        await db.query(
            'INSERT INTO site_settings (setting_key, setting_value, setting_type) ' +
            'VALUES ($1, $2, $3) ON CONFLICT (setting_key) DO UPDATE SET ' +
            'setting_value = EXCLUDED.setting_value, ' +
            'setting_type = EXCLUDED.setting_type, ' +
            'updated_at = CURRENT_TIMESTAMP',
            ['beranda_profil_image', newImagePath, 'image']
        );

        await removeCmsImageIfUnreferenced(
            oldResult.rows[0]?.setting_value
        );

        return res.status(200).json({
            success: true,
            message: 'Foto Profil Singkat berhasil diperbarui.',
            data: {
                image: cmsMediaService.getCmsImageUrl(newImagePath)
            }
        });
    } catch (error) {
        if (newImagePath) {
            await removeCmsImageIfUnreferenced(newImagePath);
        }

        next(error);
    }
};
module.exports = {
    getHomeContent,
    getAboutContent,
    getPublicPosts,
    getPublicPostBySlug,
    updatePostStatus,
    getPublicFaqs,
    getPublicGalleries,
    getSiteSettings,
    saveSiteSetting,
    uploadProfileImage,
    uploadAboutProfileImage,

    postsCrud,
    faqsCrud,
    galleriesCrud,
    updateGallery,
    deleteGallery,
    updateGalleryStatus,
    heroCrud,
    profilesCrud,
    aboutItemsCrud,
    divisionsCrud,
    membersCrud,
    updateDivision,
    deleteDivision,
    updateDivisionStatus,
    updateMember,
    deleteMember,
    updateMemberStatus,
    unassignMember,
    historyCrud,
    updateHistory,
    deleteHistory,
    updateHistoryStatus
};












