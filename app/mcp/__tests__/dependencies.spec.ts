import { PYTH_INSTRUCTIONS, PYTH_ORACLE_PROGRAM_IDS } from '@explorer/decoder-pyth';
import { getBase58Decoder } from '@solana/kit';
import { ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS } from '@solana-program/zk-elgamal-proof';
import { describe, expect, it } from 'vitest';

import { decodeInstructionFallback } from '../dependencies';

const PUBLISHER = '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi';
const PRICE = '7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1';

function u16(value: number): number[] {
    return [value & 0xff, value >> 8];
}

function u32(value: number): number[] {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return [...bytes];
}

function u64(value: bigint): number[] {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, value, true);
    return [...bytes];
}

function i64(value: bigint): number[] {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigInt64(0, value, true);
    return [...bytes];
}

function lpString(value: string): number[] {
    const bytes = new TextEncoder().encode(value);
    return [bytes.length, ...bytes];
}

function pythInstruction(type: keyof typeof PYTH_INSTRUCTIONS, ...payload: number[][]) {
    const data = new Uint8Array([...u32(2), ...u32(PYTH_INSTRUCTIONS[type].index), ...payload.flat()]);
    return {
        accounts: [PUBLISHER, PRICE].map(address => ({ address, signer: false, writable: false })),
        data: getBase58Decoder().decode(data),
        programId: PYTH_ORACLE_PROGRAM_IDS.mainnet,
    };
}

describe('decodeInstructionFallback', () => {
    it('should decode a dispatcher-registered program into a JSON-safe payload', () => {
        const decoded = decodeInstructionFallback?.(
            pythInstruction('UpdatePriceNoFailOnError', u32(1), u32(0), i64(-12345n), u64(678n), u64(170_640_000n)),
        );

        expect(decoded).toEqual({
            info: {
                conf: 678,
                price: -12345,
                pricePubkey: PRICE,
                publishSlot: 170_640_000,
                publisherPubkey: PUBLISHER,
                status: 1,
            },
            program: 'pyth',
            type: 'UpdatePriceNoFailOnError',
        });
        expect(() => JSON.stringify(decoded)).not.toThrow();
    });

    it('should keep product attributes through the wire-format round trip', () => {
        const decoded = decodeInstructionFallback?.(
            pythInstruction(
                'UpdateProduct',
                lpString('symbol'),
                lpString('BTC/USD'),
                lpString('asset_type'),
                lpString('Crypto'),
            ),
        );

        expect(decoded?.type).toBe('UpdateProduct');
        expect(JSON.parse(JSON.stringify(decoded?.info))).toMatchObject({
            attributes: { asset_type: 'Crypto', symbol: 'BTC/USD' },
        });
    });

    it('should decode an ed25519 offsets table into plain numbers', () => {
        const decoded = decodeInstructionFallback?.({
            accounts: [],
            data: getBase58Decoder().decode(
                new Uint8Array([
                    1,
                    0,
                    ...u16(16),
                    ...u16(65535),
                    ...u16(80),
                    ...u16(65535),
                    ...u16(112),
                    ...u16(5),
                    ...u16(2),
                ]),
            ),
            programId: 'Ed25519SigVerify111111111111111111111111111',
        });

        expect(decoded).toEqual({
            info: {
                signatures: [
                    {
                        messageDataOffset: 112,
                        messageDataSize: 5,
                        messageInstructionIndex: 2,
                        publicKeyInstructionIndex: 65535,
                        publicKeyOffset: 80,
                        signatureInstructionIndex: 65535,
                        signatureOffset: 16,
                    },
                ],
            },
            program: 'ed25519',
            type: 'Verify',
        });
    });

    it('should decode a zk-elgamal-proof verify instruction with its context accounts', () => {
        const decoded = decodeInstructionFallback?.({
            accounts: [PRICE, PUBLISHER].map(address => ({ address, signer: false, writable: false })),
            data: getBase58Decoder().decode(new Uint8Array([3, 10, 20, 30])),
            programId: ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS,
        });

        expect(decoded).toEqual({
            info: {
                contextState: PRICE,
                contextStateAuthority: PUBLISHER,
                name: 'Verify Ciphertext-Commitment Equality',
                proofByteLength: 3,
            },
            program: 'zk-elgamal-proof',
            type: 'VerifyProof',
        });
    });

    it('should return undefined for a program no slice handles', () => {
        const decoded = decodeInstructionFallback?.({
            accounts: [],
            data: '',
            programId: '11111111111111111111111111111112',
        });

        expect(decoded).toBeUndefined();
    });
});
