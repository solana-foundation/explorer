import { camelToTitleCase } from '@utils/index';

import { resolveProgramClientInstructionName } from '../program-client-name';

const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const STAKE_PROGRAM = 'Stake11111111111111111111111111111111111111';

const CONFIGURED_PROGRAMS = [
    ['System', SYSTEM_PROGRAM],
    ['Token', TOKEN_PROGRAM],
    ['Token-2022', TOKEN_2022_PROGRAM],
    ['Associated Token', ASSOCIATED_TOKEN_PROGRAM],
    ['Stake', STAKE_PROGRAM],
] as const;

function name(programId: string, bytes: number[]): string | undefined {
    return resolveProgramClientInstructionName({ data: Uint8Array.from(bytes), programId });
}

describe('resolveProgramClientInstructionName', () => {
    describe('positive cases: recognized instructions', () => {
        it.each([
            ['System transfer', SYSTEM_PROGRAM, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'Transfer'],
            ['Token transferChecked', TOKEN_PROGRAM, [12, 0, 0, 0, 0, 0, 0, 0, 0, 6], 'Transfer Checked'],
            ['Token closeAccount', TOKEN_PROGRAM, [9], 'Close Account'],
            ['Token syncNative', TOKEN_PROGRAM, [17], 'Sync Native'],
            ['Token-2022 transferChecked', TOKEN_2022_PROGRAM, [12, 0, 0, 0, 0, 0, 0, 0, 0, 6], 'Transfer Checked'],
            ['ATA createIdempotent', ASSOCIATED_TOKEN_PROGRAM, [1], 'Create Idempotent'],
            ['Stake withdraw', STAKE_PROGRAM, [4, 0, 0, 0, 0, 0, 0, 0, 0], 'Withdraw'],
        ])('should name a %s instruction', (_label, programId, bytes, expected) => {
            expect(name(programId, bytes)).toBe(expected);
        });

        // Many clients send the legacy ATA Create with no data at all. Without the discriminator the
        // generated client cannot identify it, so the resolver restores the canonical byte first.
        it('should name the legacy ATA create sent with empty data', () => {
            expect(name(ASSOCIATED_TOKEN_PROGRAM, [])).toBe('Create');
        });

        /**
         * Token-2022 groups its extension instructions behind a shared leading byte and reads a second
         * byte to tell them apart, so a two-byte lookup must resolve to the extension's own name rather
         * than to the group's. Nothing else in this spec enters that path — every other Token-2022 case
         * is a single-byte base instruction.
         */
        it.each([
            ['transferCheckedWithFee', [26, 1], 'Transfer Checked With Fee'],
            ['enableCpiGuard', [34, 0], 'Enable Cpi Guard'],
        ])('should read the second byte to name the %s extension', (_label, bytes, expected) => {
            expect(name(TOKEN_2022_PROGRAM, bytes)).toBe(expected);
        });
    });

    /**
     * The whole point of this resolver: a simulated instruction must read exactly as the same
     * instruction reads on a fetched transaction, where the name comes from the RPC's `parsed.type`.
     * The generated enum names disagree with the RPC for 7 of System's 13 instructions, for Stake's
     * delegate, and for all three ATA instructions, so those are mapped back to the RPC spelling.
     */
    describe('wording matches the RPC parse', () => {
        it.each([
            // System discriminators are 4-byte little-endian, unlike Token's single byte.
            ['transfer', SYSTEM_PROGRAM, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['advanceNonce', SYSTEM_PROGRAM, [4, 0, 0, 0]],
            ['withdrawNonce', SYSTEM_PROGRAM, [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['initializeNonce', SYSTEM_PROGRAM, [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['authorizeNonce', SYSTEM_PROGRAM, [7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['createAccount', SYSTEM_PROGRAM, [0, 0, 0, 0]],
            ['delegate', STAKE_PROGRAM, [2, 0, 0, 0]],
            ['createIdempotent', ASSOCIATED_TOKEN_PROGRAM, [1]],
            ['recoverNested', ASSOCIATED_TOKEN_PROGRAM, [2]],
            ['transferChecked', TOKEN_PROGRAM, [12, 0, 0, 0, 0, 0, 0, 0, 0, 6]],
            ['closeAccount', TOKEN_PROGRAM, [9]],
        ])('should word %s as the RPC does', (parsedType, programId, bytes) => {
            expect(name(programId, bytes)).toBe(camelToTitleCase(parsedType));
        });
    });

    describe('negative cases: other programs and unrecognized data', () => {
        it('should return undefined for a program with no generated client', () => {
            expect(name('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', [229, 23, 203, 151, 122, 227, 173, 42])).toBe(
                undefined,
            );
        });

        /**
         * Every configured client, not just one. The clients do not agree on the error they throw for an
         * unrecognized discriminator — `@solana-program/token-2022` and `@solana-program/stake` throw a
         * plain `Error` where the others throw a `SolanaError` — so a single-program case passes while
         * the others escape the resolver. Every caller resolves names during render with no local error
         * boundary, so an escaped throw replaces the whole page. This table fails on the next client
         * that invents a third error type.
         */
        it.each(CONFIGURED_PROGRAMS)(
            'should return undefined for an unrecognized %s discriminator',
            (_l, programId) => {
                expect(name(programId, [250])).toBeUndefined();
            },
        );

        // A Token-2022 extension group byte with its second byte missing — a truncated instruction reaches
        // the two-byte read with nothing to read.
        it('should return undefined for a truncated Token-2022 extension instruction', () => {
            expect(name(TOKEN_2022_PROGRAM, [44])).toBeUndefined();
        });

        // Only the ATA client treats empty data as a real instruction; the rest cannot name it.
        it('should return undefined for empty data', () => {
            expect(name(SYSTEM_PROGRAM, [])).toBeUndefined();
        });
    });
});
