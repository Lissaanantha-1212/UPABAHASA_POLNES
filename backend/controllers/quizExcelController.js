const ExcelJS = require('exceljs');
const db = require('../config/db.pg');

const CATEGORIES = ['listening', 'reading', 'structure'];

const HEADERS = [
    'Question',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer',
    'Explanation',
    'Subtopic',
    'Recommendation Material'
];

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const cellText = (cell) => {
    if (!cell || cell.value === null || cell.value === undefined) {
        return '';
    }

    return String(cell.text || '').trim();
};

const validateExcelQuestion = (data) => {
    if (!data.question_text) {
        return 'Teks pertanyaan wajib diisi.';
    }

    if (!data.subtopic) {
        return 'Subtopik wajib diisi.';
    }

    if (!data.explanation) {
        return 'Pembahasan wajib diisi.';
    }

    if (!data.recommendation_material) {
        return 'Rekomendasi materi wajib diisi.';
    }

    if (!data.options[0]?.text) {
        return 'Pilihan A wajib diisi.';
    }

    if (!data.options[1]?.text) {
        return 'Pilihan B wajib diisi.';
    }

    if (!data.options[2]?.text) {
        return 'Pilihan C wajib diisi.';
    }

    if (data.options.length < 3 || data.options.length > 4) {
        return 'Pilihan jawaban harus berjumlah 3 sampai 4.';
    }

    if (data.options.length === 4 && !data.options[3]?.text) {
        return 'Pilihan D tidak boleh kosong jika digunakan.';
    }

    if (!['A', 'B', 'C', 'D'].includes(data.correct_answer)) {
        return 'Kunci jawaban harus berupa satu huruf A, B, C, atau D.';
    }

    const availableLabels = data.options.map(option => option.label);

    if (!availableLabels.includes(data.correct_answer)) {
        return 'Kunci jawaban tidak sesuai dengan pilihan yang tersedia.';
    }

    return null;
};

const readWorksheet = (worksheet) => {
    if (!worksheet || worksheet.rowCount < 2) {
        throw new Error('File Excel belum memiliki data soal.');
    }

    const headerMap = new Map();
    const duplicateHeaders = [];

    worksheet.getRow(1).eachCell((cell, colNumber) => {
        const header = cellText(cell).toLowerCase();

        if (!header) return;

        if (headerMap.has(header)) {
            duplicateHeaders.push(header);
            return;
        }

        headerMap.set(header, colNumber);
    });

    if (duplicateHeaders.length) {
        throw new Error(
            `Terdapat nama kolom yang duplikat: ${duplicateHeaders.join(', ')}.`
        );
    }

    const missingHeaders = HEADERS.filter(
        header => !headerMap.has(header.toLowerCase())
    );

    if (missingHeaders.length) {
        throw new Error(
            `Kolom Excel tidak lengkap: ${missingHeaders.join(', ')}.`
        );
    }

    const questions = [];
    const errors = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const get = (header) => {
            const columnNumber = headerMap.get(header.toLowerCase());
            return cellText(row.getCell(columnNumber));
        };

        const values = HEADERS.map(get);

        if (values.every(value => !value)) continue;

        const optionA = get('Option A');
        const optionB = get('Option B');
        const optionC = get('Option C');
        const optionD = get('Option D');

        const options = [
            { label: 'A', text: optionA },
            { label: 'B', text: optionB },
            { label: 'C', text: optionC }
        ];

        if (optionD) {
            options.push({ label: 'D', text: optionD });
        }

        const question = {
            question_text: get('Question'),
            options,
            correct_answer: get('Correct Answer').toUpperCase(),
            explanation: get('Explanation'),
            subtopic: get('Subtopic'),
            recommendation_material: get('Recommendation Material')
        };

        const validationError = validateExcelQuestion(question);

        if (validationError) {
            errors.push({
                row: rowNumber,
                message: validationError
            });
        } else {
            questions.push(question);
        }
    }

    if (!questions.length && !errors.length) {
        throw new Error('Tidak ditemukan baris soal untuk diimpor.');
    }

    if (questions.length > 500) {
        throw new Error('Maksimal 500 soal dalam satu kali import.');
    }

    return { questions, errors };
};

// ======================================
// DOWNLOAD TEMPLATE
// ======================================

const downloadTemplate = asyncHandler(async (req, res) => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Template Soal');

    worksheet.addRow(HEADERS);
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    worksheet.columns = [
        { width: 40 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 18 },
        { width: 40 },
        { width: 25 },
        { width: 35 }
    ];

    const instructionSheet = workbook.addWorksheet('Petunjuk');

    instructionSheet.addRows([
        ['PETUNJUK PENGISIAN TEMPLATE SOAL KUIS'],
        ['Satu baris Excel digunakan untuk satu soal.'],
        ['Question: isi teks pertanyaan.'],
        ['Option A, B, C: wajib diisi.'],
        ['Option D: boleh dikosongkan jika hanya menggunakan tiga pilihan.'],
        ['Correct Answer: isi satu huruf A, B, C, atau D.'],
        ['Explanation: isi pembahasan jawaban.'],
        ['Subtopic: isi subtopik soal.'],
        ['Recommendation Material: isi rekomendasi materi.'],
        ['Jangan mengubah atau menghapus nama kolom pada sheet Template Soal.'],
        ['Maksimal 500 soal dalam satu kali impor.'],
        ['Soal hasil impor akan tersimpan dalam status nonaktif.']
    ]);

    instructionSheet.getColumn(1).width = 100;
    instructionSheet.getRow(1).font = { bold: true, size: 14 };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition',
        'attachment; filename="template-bank-soal-kuis.xlsx"'
    );

    return res.send(Buffer.from(buffer));
});

// ======================================
// IMPORT SOAL MANDIRI DARI EXCEL
// ======================================

const importStandaloneQuestions = asyncHandler(async (req, res) => {
    const category = String(req.body.category || '')
        .trim()
        .toLowerCase();

    if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori Kuis tidak valid.'
        });
    }

    if (!req.file || !req.file.buffer) {
        return res.status(400).json({
            success: false,
            message: 'File Excel wajib diunggah.'
        });
    }

    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.load(req.file.buffer);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'File Excel tidak dapat dibaca. Pastikan file berformat XLSX yang valid.'
        });
    }

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
        return res.status(400).json({
            success: false,
            message: 'Worksheet Excel tidak ditemukan.'
        });
    }

    let parsed;

    try {
        parsed = readWorksheet(worksheet);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (parsed.errors.length) {
        return res.status(400).json({
            success: false,
            message: 'Import dibatalkan karena terdapat soal yang tidak valid.',
            errors: parsed.errors
        });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        for (const question of parsed.questions) {
            await client.query(
                `INSERT INTO public.quiz_questions (
                    package_id,
                    category,
                    subtopic,
                    question_text,
                    options,
                    correct_answer,
                    explanation,
                    recommendation_material,
                    is_active
                )
                VALUES (
                    NULL, $1, $2, $3, $4, $5, $6, $7, FALSE
                )`,
                [
                    category,
                    question.subtopic,
                    question.question_text,
                    JSON.stringify(question.options),
                    JSON.stringify([question.correct_answer]),
                    question.explanation,
                    question.recommendation_material
                ]
            );
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: `${parsed.questions.length} soal mandiri berhasil diimpor dalam status nonaktif.`,
            data: {
                category,
                imported: parsed.questions.length,
                status: 'inactive'
            }
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error(
                'Rollback import Kuis gagal:',
                rollbackError.message
            );
        }

        throw error;
    } finally {
        client.release();
    }
});

module.exports = {
    downloadTemplate,
    importStandaloneQuestions
};
