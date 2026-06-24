import codamaPmp from '../../mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { type SupportedIdl } from '../idl-version';
import {
    buildInstructionNameResolver,
    buildInstructionNameTable,
    type InstructionNameTable,
    matchInstructionName,
} from '../instruction-name-table';

// A resolved Anchor IDL (snake_case names + 8-byte discriminators), shaped like the on-chain Voting DApp.
const anchorIdl = {
    address: 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye',
    instructions: [
        { accounts: [], args: [], discriminator: [193, 22, 99, 197, 18, 33, 115, 117], name: 'initialize_poll' },
        { accounts: [], args: [], discriminator: [227, 110, 155, 23, 136, 126, 172, 25], name: 'vote' },
    ],
    metadata: { name: 'voting', spec: '0.1.0', version: '0.1.0' },
} as unknown as SupportedIdl;

describe('instruction-name-table', () => {
    describe('Anchor IDL', () => {
        const table = buildInstructionNameTable(anchorIdl);

        it('should resolve a snake_case instruction to Title Case by discriminator, ignoring trailing args', () => {
            const data = Uint8Array.from([193, 22, 99, 197, 18, 33, 115, 117, 1, 2, 3]);
            expect(matchInstructionName(table, data)).toBe('Initialize Poll');
        });

        it('should resolve a single-word instruction', () => {
            expect(matchInstructionName(table, Uint8Array.from([227, 110, 155, 23, 136, 126, 172, 25]))).toBe('Vote');
        });

        it('should return undefined for an unknown discriminator', () => {
            expect(matchInstructionName(table, Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]))).toBeUndefined();
        });

        it('should return undefined when the data is shorter than the discriminator', () => {
            expect(matchInstructionName(table, Uint8Array.from([193, 22]))).toBeUndefined();
        });
    });

    describe('Codama IDL (Program Metadata)', () => {
        const table = buildInstructionNameTable(codamaPmp as unknown as SupportedIdl);

        // Program Metadata uses single-byte (u8) field discriminators at offset 0.
        it.each([
            [0, 'Write'],
            [1, 'Initialize'],
            [2, 'Set Authority'],
        ])('should resolve the u8 discriminator %i to its camelCase name in Title Case', (disc, expected) => {
            expect(matchInstructionName(table, Uint8Array.from([disc]))).toBe(expected);
        });

        it('should return undefined for an unused discriminator byte', () => {
            expect(matchInstructionName(table, Uint8Array.from([250]))).toBeUndefined();
        });
    });

    describe('longest-prefix matching', () => {
        // A short discriminator must never shadow a longer, more specific one.
        const table: InstructionNameTable = [
            { discriminator: Uint8Array.from([1]), name: 'Short' },
            { discriminator: Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), name: 'Long' },
        ];

        it('should prefer the longest matching discriminator', () => {
            expect(matchInstructionName(table, Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('Long');
        });

        it('should fall back to the short match when the long one does not apply', () => {
            expect(matchInstructionName(table, Uint8Array.from([1, 9, 9]))).toBe('Short');
        });
    });

    describe('buildInstructionNameResolver (precedence)', () => {
        const programMetadataIdl = codamaPmp as unknown as SupportedIdl;

        // An Anchor IDL whose 8-byte discriminator starts with byte 1 — the same byte program-metadata's
        // u8 discriminator claims — so the two tables overlap on the same instruction data.
        const overlappingAnchorIdl = {
            instructions: [
                { accounts: [], args: [], discriminator: [1, 2, 3, 4, 5, 6, 7, 8], name: 'anchor_initialize' },
            ],
            metadata: { name: 'overlap', spec: '0.1.0', version: '0.1.0' },
        } as unknown as SupportedIdl;

        const overlappingData = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);

        it('should prefer the program-metadata name over Anchor even when Anchor matches more bytes', () => {
            // program-metadata's 1-byte disc wins over Anchor's 8-byte disc: source order, not longest prefix.
            const resolve = buildInstructionNameResolver([programMetadataIdl, overlappingAnchorIdl]);
            expect(resolve?.(overlappingData)).toBe('Initialize');
        });

        it('should honor the order it is given (Anchor first wins)', () => {
            const resolve = buildInstructionNameResolver([overlappingAnchorIdl, programMetadataIdl]);
            expect(resolve?.(overlappingData)).toBe('Anchor Initialize');
        });

        it('should fall through to Anchor when program-metadata does not name the instruction', () => {
            const resolve = buildInstructionNameResolver([programMetadataIdl, anchorIdl]);
            expect(resolve?.(Uint8Array.from([193, 22, 99, 197, 18, 33, 115, 117]))).toBe('Initialize Poll');
        });

        it('should return undefined when no table names the instruction', () => {
            const resolve = buildInstructionNameResolver([programMetadataIdl, anchorIdl]);
            expect(resolve?.(Uint8Array.from([99, 99, 99, 99, 99, 99, 99, 99]))).toBeUndefined();
        });

        it('should return no resolver when no IDL yields a usable table', () => {
            expect(buildInstructionNameResolver([undefined, undefined])).toBeUndefined();
            expect(buildInstructionNameResolver([])).toBeUndefined();
        });
    });
});
