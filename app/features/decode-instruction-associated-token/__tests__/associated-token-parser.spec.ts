import { PublicKey } from '@solana/web3.js';
import { describe, expect, test } from 'vitest';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { intoTransactionInstructionFromVersionedMessage } from '@/app/components/inspector/utils';
import { invariant } from '@/app/shared/lib/invariant';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { parseAssociatedTokenInstruction } from '../lib/associated-token-parser';

function parseFixture(stub: string, index: number, v0 = false) {
    const message = v0 ? mock.deserializeMessageV0(stub) : mock.deserializeMessage(stub);
    const instruction = intoTransactionInstructionFromVersionedMessage(message.compiledInstructions[index], message);
    return parseAssociatedTokenInstruction(toKitInstruction(instruction));
}

/**
 * Each test asserts the canonical field names, not the kit decoder's names. That
 * mapping (`payer`->`source`, `ata`->`account`, `owner`->`wallet`, and the
 * seven-account recoverNested rename) is the parser's load-bearing logic — it is
 * what lets the byte path and the RPC path share one shape and one card.
 */
describe('parseAssociatedTokenInstruction', () => {
    test('should map "create" accounts onto the canonical field names', () => {
        const result = parseFixture(stubs.aTokenCreateMsgWithInnerCards, 2);
        invariant(result, 'expected parser to return a result for AT create');
        invariant(result.type === 'create', 'expected create');

        expect(result.info.source.equals(new PublicKey('Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx'))).toBe(true);
        expect(result.info.account.equals(new PublicKey('9E3HDj8spudEWc26h5wu8EUpyfYDbJjjVYaZpv49nzGH'))).toBe(true);
        expect(result.info.wallet.equals(new PublicKey('Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx'))).toBe(true);
        expect(result.info.mint.equals(new PublicKey('So11111111111111111111111111111111111111112'))).toBe(true);
        expect(result.info.systemProgram.equals(new PublicKey('11111111111111111111111111111111'))).toBe(true);
        expect(result.info.tokenProgram.equals(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'))).toBe(
            true,
        );
    });

    test('should map "createIdempotent" accounts onto the canonical field names', () => {
        const result = parseFixture(stubs.aTokenCreateIdempotentMsg, 1, true);
        invariant(result, 'expected parser to return a result for AT createIdempotent');
        invariant(result.type === 'createIdempotent', 'expected createIdempotent');

        expect(result.info.source.equals(new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'))).toBe(true);
        expect(result.info.account.equals(new PublicKey('Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1'))).toBe(true);
        expect(result.info.wallet.equals(new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'))).toBe(true);
        expect(result.info.mint.equals(new PublicKey('74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump'))).toBe(true);
        expect(result.info.systemProgram.equals(new PublicKey('11111111111111111111111111111111'))).toBe(true);
        expect(result.info.tokenProgram.equals(new PublicKey('EDDSpjZHrsFKYTMJDcBqXAjkLcu9EKdvrQR4XnqsXErH'))).toBe(
            true,
        );
    });

    test('should map "recoverNested" accounts onto the canonical field names', () => {
        const result = parseFixture(stubs.aTokenRecoverNestedMsg, 0);
        invariant(result, 'expected parser to return a result for AT recoverNested');
        invariant(result.type === 'recoverNested', 'expected recoverNested');

        // Kit order is [nestedSource, nestedMint, destination, nestedOwner,
        // ownerMint, wallet, tokenProgram] — note destination and nestedOwner are
        // not in display order, which is what the old positional card got wrong.
        expect(result.info.nestedSource.equals(new PublicKey('CfR4Z2zwj2Wz5eX6GLf34CYiyK8hestfvpfub9LLDnNR'))).toBe(
            true,
        );
        expect(result.info.nestedMint.equals(new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'))).toBe(true);
        expect(result.info.destination.equals(new PublicKey('4dbCSgnyU8V8HqmFHcRqwBym3dUQK2MVacXQgAkaeYKU'))).toBe(
            true,
        );
        expect(result.info.nestedOwner.equals(new PublicKey('BSqjYANCyCpxTneP9KsWMexwZkk5XJ1nkKws1Zg3X9KH'))).toBe(
            true,
        );
        expect(result.info.ownerMint.equals(new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'))).toBe(true);
        expect(result.info.wallet.equals(new PublicKey('3UgveoWTHgDWH4DC8NUoYcQc11vJ8xzk2hCge2ZWPDSL'))).toBe(true);
        expect(result.info.tokenProgram.equals(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'))).toBe(
            true,
        );
    });

    test('should parse an empty-data instruction as "create"', () => {
        // Some clients send the AT Create instruction with empty data instead
        // of the single-byte discriminator. The parser reconstructs the
        // canonical discriminator and MUST treat it as create, not Unknown.
        const index = 2;
        const message = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const instruction = intoTransactionInstructionFromVersionedMessage(
            message.compiledInstructions[index],
            message,
        );
        const emptyDataIx = { ...toKitInstruction(instruction), data: new Uint8Array(0) };

        const result = parseAssociatedTokenInstruction(emptyDataIx);
        invariant(result, 'expected parser to return a result for empty-data AT create');

        expect(result.type).toBe('create');
    });

    test('should not mutate the input instruction.data when reconstructing the create discriminator', () => {
        const index = 2;
        const message = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const instruction = intoTransactionInstructionFromVersionedMessage(
            message.compiledInstructions[index],
            message,
        );
        const originalData = instruction.data;
        const originalLength = originalData.length;
        const originalBytes = Array.from(originalData);

        parseAssociatedTokenInstruction(toKitInstruction(instruction));

        expect(instruction.data).toBe(originalData);
        expect(instruction.data.length).toBe(originalLength);
        expect(Array.from(instruction.data)).toEqual(originalBytes);
    });
});
