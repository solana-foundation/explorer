import { camelToTitleCase } from '@utils/index';

import { resolveProgramClientInstructionName } from '../program-client-name';

const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const STAKE_PROGRAM = 'Stake11111111111111111111111111111111111111';
const ADDRESS_LOOKUP_TABLE_PROGRAM = 'AddressLookupTab1e1111111111111111111111111';

const CONFIGURED_PROGRAMS = [
    ['System', SYSTEM_PROGRAM],
    ['Token', TOKEN_PROGRAM],
    ['Token-2022', TOKEN_2022_PROGRAM],
    ['Associated Token', ASSOCIATED_TOKEN_PROGRAM],
    ['Stake', STAKE_PROGRAM],
    ['Address Lookup Table', ADDRESS_LOOKUP_TABLE_PROGRAM],
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
            ['ALT extendLookupTable', ADDRESS_LOOKUP_TABLE_PROGRAM, [2, 0, 0, 0], 'Extend Lookup Table'],
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
     * A simulated instruction and a history row must read exactly as the same instruction reads on a
     * fetched transaction, where the name comes from the RPC's `parsed.type`. The generated enum names
     * disagree with agave's parsers for several System instructions, for Stake's delegate, for every ATA
     * instruction and for many Token-2022 extension instructions, so those are mapped back.
     */
    describe('wording matches the RPC parse', () => {
        it.each([
            // System discriminators are 4-byte little-endian, unlike Token's single byte.
            ['transfer', SYSTEM_PROGRAM, [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['advanceNonce', SYSTEM_PROGRAM, [4, 0, 0, 0]],
            ['withdrawFromNonce', SYSTEM_PROGRAM, [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['initializeNonce', SYSTEM_PROGRAM, [6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['authorizeNonce', SYSTEM_PROGRAM, [7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            ['createAccount', SYSTEM_PROGRAM, [0, 0, 0, 0]],
            ['delegate', STAKE_PROGRAM, [2, 0, 0, 0]],
            ['createIdempotent', ASSOCIATED_TOKEN_PROGRAM, [1]],
            ['recoverNested', ASSOCIATED_TOKEN_PROGRAM, [2]],
            ['transferChecked', TOKEN_PROGRAM, [12, 0, 0, 0, 0, 0, 0, 0, 0, 6]],
            ['closeAccount', TOKEN_PROGRAM, [9]],
            ['closeLookupTable', ADDRESS_LOOKUP_TABLE_PROGRAM, [4, 0, 0, 0]],
            // A Token-2022 extension instruction's leading byte selects the extension, the next its instruction.
            ['applyPendingConfidentialTransferBalance', TOKEN_2022_PROGRAM, [27, 8]],
            ['depositConfidentialTransfer', TOKEN_2022_PROGRAM, [27, 5]],
            ['withdrawConfidentialTransfer', TOKEN_2022_PROGRAM, [27, 6]],
            ['enableConfidentialTransferConfidentialCredits', TOKEN_2022_PROGRAM, [27, 9]],
            ['disableConfidentialTransferConfidentialCredits', TOKEN_2022_PROGRAM, [27, 10]],
            ['enableConfidentialTransferNonConfidentialCredits', TOKEN_2022_PROGRAM, [27, 11]],
            ['disableConfidentialTransferNonConfidentialCredits', TOKEN_2022_PROGRAM, [27, 12]],
            ['configureConfidentialAccountWithRegistry', TOKEN_2022_PROGRAM, [27, 14]],
            ['enableRequiredMemoTransfers', TOKEN_2022_PROGRAM, [30, 0]],
            ['disableRequiredMemoTransfers', TOKEN_2022_PROGRAM, [30, 1]],
            ['initializeInterestBearingConfig', TOKEN_2022_PROGRAM, [33, 0]],
            ['updateInterestBearingConfigRate', TOKEN_2022_PROGRAM, [33, 1]],
            ['initializeConfidentialTransferFeeConfig', TOKEN_2022_PROGRAM, [37, 0]],
            ['withdrawWithheldConfidentialTransferTokensFromMint', TOKEN_2022_PROGRAM, [37, 1]],
            ['withdrawWithheldConfidentialTransferTokensFromAccounts', TOKEN_2022_PROGRAM, [37, 2]],
            ['harvestWithheldConfidentialTransferTokensToMint', TOKEN_2022_PROGRAM, [37, 3]],
            ['enableConfidentialTransferFeeHarvestToMint', TOKEN_2022_PROGRAM, [37, 4]],
            ['disableConfidentialTransferFeeHarvestToMint', TOKEN_2022_PROGRAM, [37, 5]],
            ['initializeConfidentialMintBurnMint', TOKEN_2022_PROGRAM, [42, 0]],
            ['rotateConfidentialMintBurnSupplyElGamalPubkey', TOKEN_2022_PROGRAM, [42, 1]],
            ['applyPendingBurn', TOKEN_2022_PROGRAM, [42, 5]],
            ['initializeScaledUiAmountConfig', TOKEN_2022_PROGRAM, [43, 0]],
            ['updateMultiplier', TOKEN_2022_PROGRAM, [43, 1]],
            ['initializePermissionedBurnConfig', TOKEN_2022_PROGRAM, [46, 0]],
            // Token group and token metadata instructions carry an 8-byte discriminator instead.
            ['updateTokenGroupAuthority', TOKEN_2022_PROGRAM, [161, 105, 88, 1, 237, 221, 216, 203]],
            ['updateTokenMetadataAuthority', TOKEN_2022_PROGRAM, [215, 228, 166, 228, 84, 100, 86, 123]],
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
