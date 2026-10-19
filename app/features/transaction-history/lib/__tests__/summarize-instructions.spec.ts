import { describe, expect, it } from 'vitest';

import { summarizeInstructions } from '../summarize-instructions';

describe('summarizeInstructions', () => {
    it('should collapse identical instructions and count them', () => {
        const result = summarizeInstructions([
            { name: 'Transfer', programName: 'Token Program' },
            { name: 'Transfer', programName: 'Token Program' },
            { name: 'Transfer', programName: 'Token Program' },
        ]);

        expect(result).toEqual([{ count: 3, instruction: { name: 'Transfer', programName: 'Token Program' } }]);
    });

    it('should keep instructions with the same name but different programs separate', () => {
        const result = summarizeInstructions([
            { name: 'Transfer', programName: 'System Program' },
            { name: 'Transfer', programName: 'Token Program' },
        ]);

        expect(result.map(r => r.instruction.programName)).toEqual(['System Program', 'Token Program']);
        expect(result.every(r => r.count === 1)).toBe(true);
    });

    it('should preserve first-occurrence order', () => {
        const result = summarizeInstructions([
            { name: 'Mint To', programName: 'Token Program' },
            { name: 'Transfer', programName: 'Token Program' },
            { name: 'Mint To', programName: 'Token Program' },
        ]);

        expect(result.map(r => r.instruction.name)).toEqual(['Mint To', 'Transfer']);
        expect(result.map(r => r.count)).toEqual([2, 1]);
    });

    it('should return an empty array for no instructions', () => {
        expect(summarizeInstructions([])).toEqual([]);
    });
});
