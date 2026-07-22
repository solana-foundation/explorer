import { isParsedInstruction } from '@entities/instruction-parser';
import { address, createNoopSigner, type ReadonlyUint8Array } from '@solana/kit';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getInitializeTokenGroupInstruction,
    getUpdateTokenMetadataFieldInstruction,
    TOKEN_2022_PROGRAM_ADDRESS,
    tokenMetadataField,
} from '@solana-program/token-2022';
import { describe, expect, test } from 'vitest';

import { instructionParserDispatcher } from '../instruction-parser-dispatcher';

/**
 * Integration coverage for the Token-2022 SPL-interface fix, exercised through
 * the real inspector entry point (`fromTransactionInstruction`) rather than the
 * slice parser in isolation. These instructions were silently unparsable
 * because the upstream Codama decoder declares their 8-byte discriminator as an
 * unbounded bytes field; this guards the whole byte path from kit builder →
 * dispatcher → parsed instruction.
 */
describe('Token-2022 SPL-interface instructions via the inspector dispatcher', () => {
    const PROGRAM_ID = new PublicKey(TOKEN_2022_PROGRAM_ADDRESS);

    function inspect(kitIx: { accounts: readonly { address: string }[]; data: ReadonlyUint8Array }) {
        const rawIx = new TransactionInstruction({
            data: Buffer.from(new Uint8Array(kitIx.data)),
            keys: kitIx.accounts.map(a => ({ isSigner: false, isWritable: false, pubkey: new PublicKey(a.address) })),
            programId: PROGRAM_ID,
        });
        return instructionParserDispatcher.fromTransactionInstruction(rawIx);
    }

    test('should decode UpdateTokenMetadataField end-to-end', () => {
        const metadata = Keypair.generate().publicKey;
        const updateAuthority = Keypair.generate().publicKey;

        const result = inspect(
            getUpdateTokenMetadataFieldInstruction({
                field: tokenMetadataField('Name'),
                metadata: address(metadata.toBase58()),
                updateAuthority: createNoopSigner(address(updateAuthority.toBase58())),
                value: 'My Token',
            }),
        );

        if (!isParsedInstruction(result)) throw new Error('UpdateTokenMetadataField should be recognised');
        expect(result.program).toBe('spl-token-2022');
        expect(result.parsed.type).toBe('updateTokenMetadataField');
        const info = result.parsed.info as {
            field: string;
            metadata: PublicKey;
            updateAuthority: PublicKey;
            value: string;
        };
        expect(info.field).toBe('name');
        expect(info.value).toBe('My Token');
        expect(info.metadata.equals(metadata)).toBe(true);
        expect(info.updateAuthority.equals(updateAuthority)).toBe(true);
    });

    test('should decode InitializeTokenGroup end-to-end, unwrapping the update authority', () => {
        const group = Keypair.generate().publicKey;
        const mint = Keypair.generate().publicKey;
        const mintAuthority = Keypair.generate().publicKey;
        const updateAuthority = Keypair.generate().publicKey;

        const result = inspect(
            getInitializeTokenGroupInstruction({
                group: address(group.toBase58()),
                maxSize: 100n,
                mint: address(mint.toBase58()),
                mintAuthority: createNoopSigner(address(mintAuthority.toBase58())),
                updateAuthority: address(updateAuthority.toBase58()),
            }),
        );

        if (!isParsedInstruction(result)) throw new Error('InitializeTokenGroup should be recognised');
        expect(result.parsed.type).toBe('initializeTokenGroup');
        const info = result.parsed.info as { group: PublicKey; maxSize: bigint; updateAuthority?: PublicKey };
        expect(info.group.equals(group)).toBe(true);
        expect(info.maxSize).toBe(100n);
        expect(info.updateAuthority?.equals(updateAuthority)).toBe(true);
    });
});
