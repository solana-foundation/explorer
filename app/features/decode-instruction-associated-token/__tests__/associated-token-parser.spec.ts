import * as spl from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, test } from 'vitest';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { intoTransactionInstructionFromVersionedMessage } from '@/app/components/inspector/utils';
import { invariant } from '@/app/shared/lib/invariant';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { parseAssociatedTokenInstruction } from '../lib/associated-token-parser';

describe('parseAssociatedTokenInstruction', () => {
    test('should return "create" instruction data', () => {
        const index = 2;
        const message = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const instruction = intoTransactionInstructionFromVersionedMessage(
            message.compiledInstructions[index],
            message,
        );
        const result = parseAssociatedTokenInstruction(toKitInstruction(instruction));
        invariant(result, 'expected parser to return a result for AT create');

        expect(result.type).toBe('create');
        const info = result.info as {
            data: { discriminator: number };
            programAddress: string;
            accounts: Record<string, { address: string }>;
        };
        expect(info.data).toEqual({ discriminator: 0 });
        expect(info.programAddress).toEqual(spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        const expectedAccounts = [
            new PublicKey('Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx'),
            new PublicKey('9E3HDj8spudEWc26h5wu8EUpyfYDbJjjVYaZpv49nzGH'),
            new PublicKey('Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx'),
            new PublicKey('So11111111111111111111111111111111111111112'),
            new PublicKey('11111111111111111111111111111111'),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ];
        Object.values(info.accounts).forEach((account, i) => {
            expect(new PublicKey(account.address).equals(expectedAccounts[i])).toBeTruthy();
        });
        expect(Object.keys(info.accounts)).toEqual(['payer', 'ata', 'owner', 'mint', 'systemProgram', 'tokenProgram']);
    });

    test('should return "createIdempotent" instruction data', () => {
        const index = 1;
        const message = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const instruction = intoTransactionInstructionFromVersionedMessage(
            message.compiledInstructions[index],
            message,
        );
        const result = parseAssociatedTokenInstruction(toKitInstruction(instruction));
        invariant(result, 'expected parser to return a result for AT createIdempotent');

        expect(result.type).toBe('createIdempotent');
        const info = result.info as {
            data: { discriminator: number };
            programAddress: string;
            accounts: Record<string, { address: string }>;
        };
        expect(info.data).toEqual({ discriminator: 1 });
        expect(info.programAddress).toEqual(spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        const expectedAccounts = [
            new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
            new PublicKey('Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1'),
            new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
            new PublicKey('74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump'),
            new PublicKey('11111111111111111111111111111111'),
            new PublicKey('EDDSpjZHrsFKYTMJDcBqXAjkLcu9EKdvrQR4XnqsXErH'),
        ];
        Object.values(info.accounts).forEach((account, i) => {
            expect(new PublicKey(account.address).equals(expectedAccounts[i])).toBeTruthy();
        });
        expect(Object.keys(info.accounts)).toEqual(['payer', 'ata', 'owner', 'mint', 'systemProgram', 'tokenProgram']);
    });

    test('should return "recoverNested" instruction data', () => {
        const index = 0;
        const message = mock.deserializeMessage(stubs.aTokenRecoverNestedMsg);
        const instruction = intoTransactionInstructionFromVersionedMessage(
            message.compiledInstructions[index],
            message,
        );
        const result = parseAssociatedTokenInstruction(toKitInstruction(instruction));
        invariant(result, 'expected parser to return a result for AT recoverNested');

        expect(result.type).toBe('recoverNested');
        const info = result.info as {
            data: { discriminator: number };
            programAddress: string;
            accounts: Record<string, { address: string }>;
        };
        expect(info.data).toEqual({ discriminator: 2 });
        expect(info.programAddress).toEqual(spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString());
        const expectedAccounts = [
            new PublicKey('CfR4Z2zwj2Wz5eX6GLf34CYiyK8hestfvpfub9LLDnNR'),
            new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            new PublicKey('4dbCSgnyU8V8HqmFHcRqwBym3dUQK2MVacXQgAkaeYKU'),
            new PublicKey('BSqjYANCyCpxTneP9KsWMexwZkk5XJ1nkKws1Zg3X9KH'),
            new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
            new PublicKey('3UgveoWTHgDWH4DC8NUoYcQc11vJ8xzk2hCge2ZWPDSL'),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ];
        Object.values(info.accounts).forEach((account, i) => {
            expect(new PublicKey(account.address).equals(expectedAccounts[i])).toBeTruthy();
        });
        expect(Object.keys(info.accounts)).toEqual([
            'nestedAssociatedAccountAddress',
            'nestedTokenMintAddress',
            'destinationAssociatedAccountAddress',
            'ownerAssociatedAccountAddress',
            'ownerTokenMintAddress',
            'walletAddress',
            'tokenProgram',
        ]);
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
