import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { AccountRole, type Address, address } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { solanaAttestationInstructionParser } from '../sas-client';
import {
    parseSolanaAttestationKitInstruction,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_LABEL,
} from '../sas-parser';

const PAYER = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
const CREDENTIAL = address('7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2');
const AUTHORITY = address('3EbFtRfKRMTrhPrRQjxbfWCB6NUyTQxwsWTKQFVKgNbb');
const SYSTEM = address('11111111111111111111111111111111');

/** CreateCredential: u8 discriminator 0, then a u32-prefixed name and a u32-prefixed signer list, both empty. */
const CREATE_CREDENTIAL = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0]);

const dispatcher = createInstructionParserDispatcher([solanaAttestationInstructionParser]);

function parse(data: Uint8Array, accounts: Address[]) {
    return parseSolanaAttestationKitInstruction({
        accounts: accounts.map(account => ({ address: account, role: AccountRole.READONLY })),
        data,
        programAddress: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
    });
}

describe('parseSolanaAttestationKitInstruction', () => {
    // The card titles itself from the type, so the name has to survive the enum round trip.
    it('should name the instruction in camelCase', () => {
        expect(parse(CREATE_CREDENTIAL, [PAYER, CREDENTIAL, AUTHORITY, SYSTEM])?.type).toBe('createCredential');
    });

    it('should carry the named accounts and decoded arguments', () => {
        const parsed = parse(CREATE_CREDENTIAL, [PAYER, CREDENTIAL, AUTHORITY, SYSTEM]);

        expect(Object.fromEntries(Object.entries(parsed?.info.accounts ?? {}).map(([k, v]) => [k, v.address]))).toEqual(
            { authority: AUTHORITY, credential: CREDENTIAL, payer: PAYER, systemProgram: SYSTEM },
        );
        expect(parsed?.info.data).toEqual({ discriminator: 0, name: '', signers: [] });
    });

    it('should return undefined for a discriminator the program does not define', () => {
        expect(parse(new Uint8Array([200]), [PAYER])).toBeUndefined();
    });

    it('should return undefined when the instruction is short of its accounts', () => {
        expect(parse(CREATE_CREDENTIAL, [PAYER])).toBeUndefined();
    });
});

describe('solanaAttestationInstructionParser', () => {
    it('should decode the byte path through the dispatcher', () => {
        const dispatched = dispatcher.fromTransactionInstruction(
            transactionInstruction(CREATE_CREDENTIAL, [PAYER, CREDENTIAL, AUTHORITY, SYSTEM]),
        );

        expect(isParsedInstruction(dispatched)).toBe(true);
        expect(dispatched).toMatchObject({
            parsed: { type: 'createCredential' },
            program: SOLANA_ATTESTATION_SERVICE_PROGRAM_LABEL,
        });
    });

    it('should report an undecodable instruction as unknown to this program', () => {
        expect(dispatcher.fromTransactionInstruction(transactionInstruction(new Uint8Array([200]), []))).toMatchObject({
            programLabel: SOLANA_ATTESTATION_SERVICE_PROGRAM_LABEL,
            unknown: true,
        });
    });
});

function transactionInstruction(data: Uint8Array, accounts: Address[]) {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: accounts.map(account => ({ isSigner: false, isWritable: false, pubkey: new PublicKey(account) })),
        programId: new PublicKey(SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS),
    });
}
