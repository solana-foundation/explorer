import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';

import {
    OPEN_BOOK_PROGRAM_IDS,
    SERUM_DEX_V1_PROGRAM_IDS,
    SERUM_DEX_V1B_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_IDS,
    SERUM_DEX_V3_PROGRAM_IDS,
} from '../program-ids';

export const SERUM_PROGRAM_IDS_BY_NAME = {
    dexV1: new PublicKey(SERUM_DEX_V1_PROGRAM_IDS.mainnet),
    dexV1b: new PublicKey(SERUM_DEX_V1B_PROGRAM_IDS.mainnet),
    dexV2: new PublicKey(SERUM_DEX_V2_PROGRAM_IDS.mainnet),
    dexV3: new PublicKey(SERUM_DEX_V3_PROGRAM_IDS.mainnet),
    openBook: new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet),
} as const;

// Bytes produced by @project-serum/serum 0.13.61 `encodeInstruction`, frozen so the vendored layout is checked
// against the original encoder rather than against itself. Variants 7/8/9/13 have no layout — use
// makeRawInstructionData for those.
export const ENCODED_INSTRUCTIONS = {
    cancelOrder: Buffer.from(
        '000400000001000000ffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000003',
        'hex',
    ),
    cancelOrderByClientId: Buffer.from('00060000006300000000000000', 'hex'),
    cancelOrderByClientIdV2: Buffer.from('000c0000007b00000000000000', 'hex'),
    cancelOrderV2: Buffer.from('000b00000000000000ffffffffffffffffffffffffffffff7f', 'hex'),
    closeOpenOrders: Buffer.from('000e000000', 'hex'),
    consumeEvents: Buffer.from('00030000001000', 'hex'),
    consumeEventsPermissioned: Buffer.from('00110000002000', 'hex'),
    initOpenOrders: Buffer.from('000f000000', 'hex'),
    initializeMarket: Buffer.from(
        '0000000000e8030000000000000a00000000000000190000000000000000006400000000000000',
        'hex',
    ),
    matchOrders: Buffer.from('00020000000500', 'hex'),
    newOrder: Buffer.from('00010000000000000050c30000000000000a00000000000000000000000700000000000000', 'hex'),
    newOrderV3: Buffer.from(
        '000a0000000100000060ea0000000000000500000000000000e09304000000000000000000020000002a00000000000000ffff',
        'hex',
    ),
    prune: Buffer.from('00100000001900', 'hex'),
    settleFunds: Buffer.from('0005000000', 'hex'),
} as const;

// Version byte 0 + u32 LE code only — for the variants encodeInstruction can't build (7/8/9/13).
export function makeRawInstructionData(code: number): Buffer {
    const buf = Buffer.alloc(5);
    buf[0] = 0;
    buf.writeUInt32LE(code, 1);
    return buf;
}

/** 14 keys — enough for the largest decoder (initializeMarket reads keys[0..12]). */
export const TEST_KEYS: PublicKey[] = Array.from({ length: 14 }, () => Keypair.generate().publicKey);

export function makeInstruction(
    data: Buffer,
    programId: PublicKey,
    keys: PublicKey[] = TEST_KEYS,
): TransactionInstruction {
    return new TransactionInstruction({
        data,
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId,
    });
}
