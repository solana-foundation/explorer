import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractSummary, toRawUrl } from '../simd-summary';

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (name: string) => readFileSync(join(FIXTURE_DIR, name), 'utf8');

describe('extractSummary', () => {
    it('should pull the first paragraph from the Summary section, after stripping front matter', () => {
        const summary = extractSummary(read('simd-with-summary.md'));
        expect(summary).toBe(
            'Introduce two new stake program instructions, MoveStake and MoveLamports, that let stake managers shuffle balance between stake accounts without holding the Withdrawer authority.',
        );
    });

    it('should fall back to the Abstract section and strip markdown emphasis', () => {
        const summary = extractSummary(read('simd-with-abstract.md'));
        expect(summary).toBe(
            'This SIMD adds support for partial priority-fee rewards by splitting the fee between the validator and the protocol.',
        );
    });

    it('should return undefined when no Summary-like section is present', () => {
        const summary = extractSummary(read('simd-no-summary.md'));
        expect(summary).toBeUndefined();
    });

    it('should truncate descriptions longer than 280 characters', () => {
        const long = `## Summary\n\n${'word '.repeat(120)}\n\n## Specification\n\nDetails.`;
        const summary = extractSummary(long);
        expect(summary).toBeDefined();
        expect(summary?.length).toBeLessThanOrEqual(280);
        expect(summary?.endsWith('…')).toBe(true);
    });
});

describe('toRawUrl', () => {
    it('should convert a GitHub blob URL into a raw.githubusercontent.com URL', () => {
        expect(
            toRawUrl(
                'https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0148-stake-program-move-instructions.md',
            ),
        ).toBe(
            'https://raw.githubusercontent.com/solana-foundation/solana-improvement-documents/main/proposals/0148-stake-program-move-instructions.md',
        );
    });

    it('should return undefined for URLs that do not match the blob pattern', () => {
        expect(toRawUrl('https://example.com/foo')).toBeUndefined();
        expect(toRawUrl('https://raw.githubusercontent.com/foo/bar/main/x.md')).toBeUndefined();
    });
});
