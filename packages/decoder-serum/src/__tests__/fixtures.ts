// encodeInstruction isn't re-exported from the package root; reach into lib/instructions.js for authentic fixtures.
import { encodeInstruction } from '@project-serum/serum/lib/instructions.js';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';

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

// Variants 7/8/9/13 are absent from the library's INSTRUCTION_LAYOUT — use makeRawInstructionData for those.
export const ENCODED_INSTRUCTIONS = {
    cancelOrder: encodeInstruction({
        cancelOrder: {
            openOrders: PublicKey.default,
            openOrdersSlot: 3,
            orderId: new BN('170141183460469231731687303715884105727'),
            side: 'sell',
        },
    }) as Buffer,
    cancelOrderByClientId: encodeInstruction({
        cancelOrderByClientId: { clientId: new BN(99) },
    }) as Buffer,
    cancelOrderByClientIdV2: encodeInstruction({
        cancelOrderByClientIdV2: { clientId: new BN(123) },
    }) as Buffer,
    cancelOrderV2: encodeInstruction({
        cancelOrderV2: { orderId: new BN('170141183460469231731687303715884105727'), side: 'buy' },
    }) as Buffer,
    closeOpenOrders: encodeInstruction({ closeOpenOrders: {} }) as Buffer,
    consumeEvents: encodeInstruction({ consumeEvents: { limit: 16 } }) as Buffer,
    consumeEventsPermissioned: encodeInstruction({
        consumeEventsPermissioned: { limit: 32 },
    }) as Buffer,
    initOpenOrders: encodeInstruction({ initOpenOrders: {} }) as Buffer,
    initializeMarket: encodeInstruction({
        initializeMarket: {
            baseLotSize: new BN(1_000),
            feeRateBps: 25,
            quoteDustThreshold: new BN(100),
            quoteLotSize: new BN(10),
            vaultSignerNonce: new BN(0),
        },
    }) as Buffer,
    matchOrders: encodeInstruction({ matchOrders: { limit: 5 } }) as Buffer,
    newOrder: encodeInstruction({
        newOrder: {
            clientId: new BN(7),
            limitPrice: new BN(50_000),
            maxQuantity: new BN(10),
            orderType: 'limit',
            side: 'buy',
        },
    }) as Buffer,
    newOrderV3: encodeInstruction({
        newOrderV3: {
            clientId: new BN(42),
            limit: 65_535,
            limitPrice: new BN(60_000),
            maxBaseQuantity: new BN(5),
            maxQuoteQuantity: new BN(300_000),
            orderType: 'postOnly',
            selfTradeBehavior: 'decrementTake',
            side: 'sell',
        },
    }) as Buffer,
    prune: encodeInstruction({ prune: { limit: 25 } }) as Buffer,
    settleFunds: encodeInstruction({ settleFunds: {} }) as Buffer,
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
