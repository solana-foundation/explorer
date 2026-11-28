import { wrap } from '@utils/index';

describe('wrap', () => {
    it('should preserve ASCII wrapping for instruction bytes', () => {
        expect(wrap('abcdefgh', 3)).toBe('abc\ndef\ngh');
        expect(wrap('', 50)).toBe('');
    });

    it('should keep a memo emoji at a line boundary intact', () => {
        const prefix = 'a'.repeat(49);
        expect(wrap(`${prefix}😀b`, 50)).toBe(`${prefix}😀\nb`);
    });

    it('should wrap consecutive supplementary characters without splitting surrogate pairs', () => {
        expect(wrap('😀🚀🌍', 1)).toBe('😀\n🚀\n🌍');
    });

    it('should preserve characters from supplementary Unicode planes in memo text', () => {
        expect(wrap('ab𠮷cd', 3)).toBe('ab𠮷\ncd');
    });
});
