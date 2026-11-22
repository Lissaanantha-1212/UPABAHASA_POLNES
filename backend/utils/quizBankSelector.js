const shuffle = (items, random = Math.random) => {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
};

const selectQuizItems = ({
    items,
    minQuestions,
    maxQuestions,
    itemsToTake = null,
    random = Math.random
}) => {
    if (!Array.isArray(items)) {
        throw new TypeError('Daftar bank soal harus berupa array.');
    }

    if (
        !Number.isInteger(minQuestions) ||
        !Number.isInteger(maxQuestions) ||
        minQuestions < 1 ||
        maxQuestions < minQuestions
    ) {
        throw new Error('Rentang jumlah soal tidak valid.');
    }

    if (
        itemsToTake !== null &&
        (!Number.isInteger(itemsToTake) || itemsToTake < 1)
    ) {
        throw new Error('Jumlah item yang harus dipilih tidak valid.');
    }

    const validItems = items.filter(
        (item) =>
            item &&
            Array.isArray(item.questions) &&
            item.questions.length > 0
    );

    const shuffledItems = shuffle(validItems, random);
    const maxItems = itemsToTake ?? shuffledItems.length;

    if (shuffledItems.length < maxItems) {
        const error = new Error(
            'Bank soal belum mencukupi untuk jumlah paket atau soal yang diminta.'
        );

        error.code = 'INSUFFICIENT_QUIZ_BANK';
        throw error;
    }

    // Dynamic programming:
    // jumlah item yang dipilih dan total pertanyaan harus memenuhi aturan.
    // Setiap item hanya dapat dipilih satu kali.
    const reachable = Array.from(
        { length: maxItems + 1 },
        () => new Map()
    );

    reachable[0].set(0, []);

    for (const item of shuffledItems) {
        const weight = item.questions.length;

        for (let count = maxItems; count >= 1; count--) {
            const previousStates = [
                ...reachable[count - 1].entries()
            ];

            for (const [currentTotal, selectedItems] of previousStates) {
                const nextTotal = currentTotal + weight;

                if (
                    nextTotal <= maxQuestions &&
                    !reachable[count].has(nextTotal)
                ) {
                    reachable[count].set(nextTotal, [
                        ...selectedItems,
                        item
                    ]);
                }
            }
        }
    }

    const targetCounts = itemsToTake !== null
        ? [itemsToTake]
        : Array.from(
            { length: maxItems },
            (_, index) => index + 1
        );

    const possibleSelections = [];

    for (const count of targetCounts) {
        for (const [total, selectedItems] of reachable[count]) {
            if (total >= minQuestions && total <= maxQuestions) {
                possibleSelections.push({
                    selectedItems,
                    totalQuestions: total
                });
            }
        }
    }

    if (possibleSelections.length === 0) {
        const error = new Error(
            'Bank soal belum mencukupi untuk panjang latihan yang dipilih.'
        );

        error.code = 'INSUFFICIENT_QUIZ_BANK';
        throw error;
    }

    const targetIndex = Math.min(
        possibleSelections.length - 1,
        Math.floor(random() * possibleSelections.length)
    );

    const selection = possibleSelections[targetIndex];

    return {
        selectedItems: selection.selectedItems,
        questions: selection.selectedItems.flatMap(
            (item) => item.questions
        ),
        totalQuestions: selection.totalQuestions
    };
};

module.exports = {
    selectQuizItems
};
