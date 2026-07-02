// @project-serum/serum's deeper module path exposes encodeInstruction, which
// the package root does not re-export. We reach in here so test fixtures can
// build authentic instruction buffers.
import { encodeInstruction } from '@project-serum/serum/lib/instructions.js';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';

import {
    OPEN_BOOK_PROGRAM_ID,
    SERUM_DEX_V1_PROGRAM_IDS,
    SERUM_DEX_V2_PROGRAM_ID,
    SERUM_DEX_V3_PROGRAM_ID,
} from '../program-ids';

/**
 * Known Serum/OpenBook program IDs. `dexV1`/`dexV1b`/`dexV2`/`dexV3` are the
 * historical Serum deployments; `openBook` is the post-fork program ID. All
 * are recognised by isSerumInstruction via SERUM_PROGRAM_IDS.
 */
export const SERUM_PROGRAM_IDS_BY_NAME = {
    dexV1: new PublicKey(SERUM_DEX_V1_PROGRAM_IDS[0]),
    dexV1b: new PublicKey(SERUM_DEX_V1_PROGRAM_IDS[1]),
    dexV2: new PublicKey(SERUM_DEX_V2_PROGRAM_ID),
    dexV3: new PublicKey(SERUM_DEX_V3_PROGRAM_ID),
    openBook: new PublicKey(OPEN_BOOK_PROGRAM_ID),
} as const;

/**
 * Pre-encoded instruction data for each Serum instruction variant supported
 * by INSTRUCTION_LAYOUT in @project-serum/serum.
 *
 * Variants 7 (DisableMarket), 8 (SweepFees), 9 (NewOrderV2), 13 (SendTake)
 * are not encoded by the library — fixtures for those are raw buffers built
 * via makeRawInstructionData(code).
 */
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

/**
 * Build a raw instruction buffer with only the version byte (0) and the
 * 4-byte little-endian instruction code. Used for variants the library does
 * not encode (disableMarket=7, sweepFees=8, newOrderV2=9, sendTake=13) when
 * the test only needs to exercise parseSerumInstructionTitle/parseSerumInstructionCode.
 */
export function makeRawInstructionData(code: number): Buffer {
    const buf = Buffer.alloc(5);
    buf[0] = 0;
    buf.writeUInt32LE(code, 1);
    return buf;
}

/** 14 deterministic keys — enough for the largest decoder (initializeMarket: keys[0..12]). */
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
