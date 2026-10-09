import { describe, expect, test } from 'vitest';

import { type AnswerBlock, answerCost, MCP_EXAMPLES, revealAnswer } from '../example-answers';

const BLOCKS: AnswerBlock[] = [
    { kind: 'text', text: 'abcdefghij' },
    {
        head: ['A', 'B'],
        kind: 'table',
        rows: [
            ['1', '2'],
            ['3', '4'],
            ['5', '6'],
        ],
    },
    { kind: 'text', text: 'tail' },
];

describe('revealAnswer', () => {
    test('should show nothing before the first character', () => {
        expect(revealAnswer(BLOCKS, 0)).toEqual([]);
    });

    test('should type the first block one character at a time and stop there', () => {
        const shown = revealAnswer(BLOCKS, 4);
        expect(shown).toHaveLength(1);
        expect(shown[0]).toMatchObject({ partial: true, text: 'abcd' });
    });

    test('should open the table on its frame, then fill rows in', () => {
        const beforeTable = 10;
        const frameOnly = revealAnswer(BLOCKS, beforeTable + 1);
        expect(frameOnly).toHaveLength(2);
        expect(frameOnly[1]).toMatchObject({ partial: true, rows: 0 });

        // 24 for the frame, then 26 per row.
        expect(revealAnswer(BLOCKS, beforeTable + 24 + 26)[1]).toMatchObject({ partial: true, rows: 1 });
        expect(revealAnswer(BLOCKS, beforeTable + 24 + 26 * 2)[1]).toMatchObject({ partial: true, rows: 2 });
    });

    test('should never reveal a later block before an earlier one is complete', () => {
        for (let revealed = 0; revealed <= answerCost(BLOCKS); revealed++) {
            const shown = revealAnswer(BLOCKS, revealed);
            const partials = shown.filter(entry => entry.partial);
            expect(partials.length).toBeLessThanOrEqual(1);
            // Only the last visible block may be mid-typing.
            if (partials.length === 1) expect(shown.at(-1)?.partial).toBe(true);
        }
    });

    test('should reveal every block completely at the full cost', () => {
        const shown = revealAnswer(BLOCKS, answerCost(BLOCKS));
        expect(shown).toHaveLength(BLOCKS.length);
        expect(shown.every(entry => !entry.partial)).toBe(true);
        expect(shown[0].text).toBe('abcdefghij');
        expect(shown[1].rows).toBe(3);
        expect(shown[2].text).toBe('tail');
    });

    test('should grow monotonically — text never shrinks, rows never go backwards', () => {
        let lastText = 0;
        let lastRows = 0;
        for (let revealed = 0; revealed <= answerCost(BLOCKS); revealed++) {
            const shown = revealAnswer(BLOCKS, revealed);
            const text = shown.reduce((sum, entry) => sum + entry.text.length, 0);
            const rows = shown.reduce((sum, entry) => sum + entry.rows, 0);
            expect(text).toBeGreaterThanOrEqual(lastText);
            expect(rows).toBeGreaterThanOrEqual(lastRows);
            lastText = text;
            lastRows = rows;
        }
    });
});

describe('MCP_EXAMPLES', () => {
    test('should play every example back to its complete answer', () => {
        for (const example of MCP_EXAMPLES) {
            const shown = revealAnswer(example.answer, answerCost(example.answer));
            expect(shown).toHaveLength(example.answer.length);
            expect(shown.every(entry => !entry.partial)).toBe(true);
        }
    });

    test('should keep ids unique and the short prompt no longer than the real question', () => {
        expect(new Set(MCP_EXAMPLES.map(example => example.id)).size).toBe(MCP_EXAMPLES.length);
        for (const example of MCP_EXAMPLES) {
            expect(example.prompt.length).toBeLessThanOrEqual(example.question.length);
        }
    });
});
