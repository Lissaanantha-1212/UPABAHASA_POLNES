const db = require('../config/db.pg');

// ======================================
// HELPER
// ======================================

const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const parseOptionalText = (value) => {
    if (value === undefined || value === null) {
        return { valid: true, value: null };
    }

    if (typeof value !== 'string') {
        return { valid: false, value: null };
    }

    return {
        valid: true,
        value: value.trim() || null
    };
};

const rollbackTransaction = async (client) => {
    try {
        await client.query('ROLLBACK');
    } catch (error) {
        console.error('Rollback Quiz Recommendation Error:', error);
    }
};

const lockActiveSubtopic = async (client, subtopicId) => {
    const result = await client.query(
        `SELECT id, category, name
         FROM public.quiz_subtopics
         WHERE id = $1
           AND is_active = TRUE
         LIMIT 1
         FOR UPDATE`,
        [subtopicId]
    );

    return result.rows[0] || null;
};

// ======================================
// GET: DAFTAR REKOMENDASI
// ======================================

exports.getRecommendations = async (req, res) => {
    try {
        const { subtopic_id } = req.query;

        let sql = `
            SELECT
                r.id,
                r.subtopic_id,
                s.category,
                s.name AS subtopic_name,
                r.title,
                r.description,
                r.resource_url AS link,
                r.created_at,
                r.updated_at
            FROM public.quiz_recommendations r
            INNER JOIN public.quiz_subtopics s
                ON s.id = r.subtopic_id
            WHERE 1 = 1
        `;

        const params = [];

        if (subtopic_id !== undefined) {
            const subtopicId = parseId(subtopic_id);

            if (!subtopicId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID subtopik tidak valid.'
                });
            }

            params.push(subtopicId);
            sql += ` AND r.subtopic_id = $${params.length}`;
        }

        sql += `
            ORDER BY
                s.category,
                s.name,
                r.created_at DESC,
                r.id DESC
        `;

        const result = await db.query(sql, params);

        return res.status(200).json({
            success: true,
            message: 'Data rekomendasi berhasil diambil.',
            data: result.rows
        });
    } catch (error) {
        console.error('Get Quiz Recommendations Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data rekomendasi.'
        });
    }
};

// ======================================
// POST: TAMBAH REKOMENDASI
// ======================================

exports.createRecommendation = async (req, res) => {
    const subtopicId = parseId(req.body.subtopic_id);
    const { title } = req.body;

    const description = parseOptionalText(req.body.description);
    const link = parseOptionalText(req.body.link);

    if (!subtopicId) {
        return res.status(400).json({
            success: false,
            message: 'Pilih subtopik yang valid.'
        });
    }

    if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Judul rekomendasi wajib diisi.'
        });
    }

    if (!description.valid) {
        return res.status(400).json({
            success: false,
            message: 'Deskripsi rekomendasi tidak valid.'
        });
    }

    if (!link.valid) {
        return res.status(400).json({
            success: false,
            message: 'Link rekomendasi tidak valid.'
        });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const subtopic = await lockActiveSubtopic(
            client,
            subtopicId
        );

        if (!subtopic) {
            await rollbackTransaction(client);

            return res.status(400).json({
                success: false,
                message: 'Subtopik tidak ditemukan atau sedang nonaktif.'
            });
        }

        const result = await client.query(
            `INSERT INTO public.quiz_recommendations (
                subtopic_id,
                title,
                description,
                resource_type,
                resource_url,
                is_active
            )
            VALUES ($1, $2, $3, 'link', $4, TRUE)
            RETURNING
                id,
                subtopic_id,
                title,
                description,
                resource_url AS link,
                created_at,
                updated_at`,
            [
                subtopicId,
                title.trim(),
                description.value,
                link.value
            ]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Rekomendasi berhasil ditambahkan.',
            data: {
                ...result.rows[0],
                category: subtopic.category,
                subtopic_name: subtopic.name
            }
        });
    } catch (error) {
        await rollbackTransaction(client);

        console.error('Create Quiz Recommendation Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal menambahkan rekomendasi.'
        });
    } finally {
        client.release();
    }
};

// ======================================
// PUT: EDIT REKOMENDASI
// ======================================

exports.updateRecommendation = async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'ID rekomendasi tidak valid.'
        });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const existingResult = await client.query(
            `SELECT id, subtopic_id, title, description, resource_url
             FROM public.quiz_recommendations
             WHERE id = $1`,
            [id]
        );

        if (!existingResult.rows.length) {
            await rollbackTransaction(client);

            return res.status(404).json({
                success: false,
                message: 'Rekomendasi tidak ditemukan.'
            });
        }

        const existing = existingResult.rows[0];
        const body = req.body;

        const subtopicId = body.subtopic_id === undefined
            ? existing.subtopic_id
            : parseId(body.subtopic_id);

        const title = body.title === undefined
            ? existing.title
            : body.title;

        const description = parseOptionalText(
            body.description === undefined
                ? existing.description
                : body.description
        );

        const link = parseOptionalText(
            body.link === undefined
                ? existing.resource_url
                : body.link
        );

        if (!subtopicId) {
            await rollbackTransaction(client);

            return res.status(400).json({
                success: false,
                message: 'Subtopik tidak valid.'
            });
        }

        if (typeof title !== 'string' || !title.trim()) {
            await rollbackTransaction(client);

            return res.status(400).json({
                success: false,
                message: 'Judul rekomendasi wajib diisi.'
            });
        }

        if (!description.valid) {
            await rollbackTransaction(client);

            return res.status(400).json({
                success: false,
                message: 'Deskripsi rekomendasi tidak valid.'
            });
        }

        if (!link.valid) {
            await rollbackTransaction(client);

            return res.status(400).json({
                success: false,
                message: 'Link rekomendasi tidak valid.'
            });
        }

        const subtopic = await lockActiveSubtopic(
            client,
            subtopicId
        );

        if (!subtopic) {
            await rollbackTransaction(client);

            return res.status(400).json({
                success: false,
                message: 'Subtopik tidak ditemukan atau sedang nonaktif.'
            });
        }

        const result = await client.query(
            `UPDATE public.quiz_recommendations
             SET subtopic_id = $1,
                 title = $2,
                 description = $3,
                 resource_url = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING
                id,
                subtopic_id,
                title,
                description,
                resource_url AS link,
                created_at,
                updated_at`,
            [
                subtopicId,
                title.trim(),
                description.value,
                link.value,
                id
            ]
        );

        await client.query('COMMIT');

        return res.status(200).json({
            success: true,
            message: 'Rekomendasi berhasil diperbarui.',
            data: {
                ...result.rows[0],
                category: subtopic.category,
                subtopic_name: subtopic.name
            }
        });
    } catch (error) {
        await rollbackTransaction(client);

        console.error('Update Quiz Recommendation Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui rekomendasi.'
        });
    } finally {
        client.release();
    }
};

// ======================================
// DELETE: HAPUS REKOMENDASI
// ======================================

exports.deleteRecommendation = async (req, res) => {
    try {
        const id = parseId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID rekomendasi tidak valid.'
            });
        }

        const result = await db.query(
            `DELETE FROM public.quiz_recommendations
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Rekomendasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Rekomendasi berhasil dihapus.'
        });
    } catch (error) {
        console.error('Delete Quiz Recommendation Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus rekomendasi.'
        });
    }
};