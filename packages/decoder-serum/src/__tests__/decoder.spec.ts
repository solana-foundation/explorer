import { describe, expect, it } from 'vitest';

import {
    decodeCancelOrder,
    decodeCancelOrderByClientId,
    decodeCancelOrderByClientIdV2,
    decodeCancelOrderV2,
    decodeCloseOpenOrders,
    decodeConsumeEvents,
    decodeConsumeEventsPermissioned,
    decodeDisableMarket,
    decodeInitializeMarket,
    decodeInitOpenOrders,
    decodeMatchOrders,
    decodeNewOrder,
    decodeNewOrderV3,
    decodePrune,
    decodeSettleFunds,
    decodeSweepFees,
    parseSerumInstructionKey,
} from '../decoder';
import {
    ENCODED_INSTRUCTIONS,
    makeInstruction,
    makeRawInstructionData,
    SERUM_PROGRAM_IDS_BY_NAME,
    TEST_KEYS,
} from './fixtures';

const programId = SERUM_PROGRAM_IDS_BY_NAME.openBook;

describe('decodeInitializeMarket', () => {
    it('should decode bigint params and account refs', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.initializeMarket, programId);
        const result = decodeInitializeMarket(ix);
        expect(result.data.baseLotSize).toBe(1_000n);
        expect(result.data.feeRateBps).toBe(25);
        expect(result.data.quoteDustThreshold).toBe(100n);
        expect(result.data.quoteLotSize).toBe(10n);
        expect(result.data.vaultSignerNonce).toBe(0n);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.baseMint).toEqual(TEST_KEYS[7]);
        expect(result.accounts.crankAuthority).toEqual(TEST_KEYS[12]);
    });
});

describe('decodeNewOrder', () => {
    it('should decode order params', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.newOrder, programId);
        const result = decodeNewOrder(ix);
        expect(result.data.clientId).toBe(7n);
        expect(result.data.limitPrice).toBe(50_000n);
        expect(result.data.maxQuantity).toBe(10n);
        expect(result.data.orderType).toBe('limit');
        expect(result.data.side).toBe('buy');
    });
});

describe('decodeNewOrderV3', () => {
    it('should decode order params', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.newOrderV3, programId);
        const result = decodeNewOrderV3(ix);
        expect(result.data.clientId).toBe(42n);
        expect(result.data.limit).toBe(65_535);
        expect(result.data.limitPrice).toBe(60_000n);
        expect(result.data.maxBaseQuantity).toBe(5n);
        expect(result.data.maxQuoteQuantity).toBe(300_000n);
        expect(result.data.orderType).toBe('postOnly');
        expect(result.data.selfTradeBehavior).toBe('decrementTake');
        expect(result.data.side).toBe('sell');
    });
});

describe('decodeCancelOrder', () => {
    it('should decode a u128 order id without precision loss', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.cancelOrder, programId);
        const result = decodeCancelOrder(ix);
        expect(result.data.openOrdersSlot).toBe(3);
        expect(result.data.orderId).toBe(170141183460469231731687303715884105727n);
        expect(result.data.side).toBe('sell');
    });
});

describe('decodeCancelOrderV2', () => {
    it('should decode a u128 order id without precision loss', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.cancelOrderV2, programId);
        const result = decodeCancelOrderV2(ix);
        expect(result.data.orderId).toBe(170141183460469231731687303715884105727n);
        expect(result.data.side).toBe('buy');
    });
});

describe('decodeCancelOrderByClientId', () => {
    it('should decode the client id', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.cancelOrderByClientId, programId);
        expect(decodeCancelOrderByClientId(ix).data.clientId).toBe(99n);
    });
});

describe('decodeCancelOrderByClientIdV2', () => {
    it('should decode the client id', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.cancelOrderByClientIdV2, programId);
        expect(decodeCancelOrderByClientIdV2(ix).data.clientId).toBe(123n);
    });
});

describe('parseSerumInstructionKey', () => {
    it.each([
        ['initializeMarket'],
        ['newOrder'],
        ['matchOrders'],
        ['consumeEvents'],
        ['cancelOrder'],
        ['settleFunds'],
        ['cancelOrderByClientId'],
        ['newOrderV3'],
        ['cancelOrderV2'],
        ['cancelOrderByClientIdV2'],
        ['closeOpenOrders'],
        ['initOpenOrders'],
        ['prune'],
        ['consumeEventsPermissioned'],
    ] as const)('should return %s for an encoded %s instruction', key => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS[key], programId);
        expect(parseSerumInstructionKey(ix)).toBe(key);
    });
});

describe('decodeMatchOrders', () => {
    it('should decode limit and account refs', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.matchOrders, programId);
        const result = decodeMatchOrders(ix);
        expect(result.programId.equals(programId)).toBe(true);
        expect(result.data.limit).toBe(5);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.requestQueue).toEqual(TEST_KEYS[1]);
        expect(result.accounts.eventQueue).toEqual(TEST_KEYS[2]);
        expect(result.accounts.bids).toEqual(TEST_KEYS[3]);
        expect(result.accounts.asks).toEqual(TEST_KEYS[4]);
    });
});

describe('decodeConsumeEvents', () => {
    it('should decode limit and slice openOrders from the leading keys', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.consumeEvents, programId);
        const result = decodeConsumeEvents(ix);
        expect(result.data.limit).toBe(16);
        expect(result.accounts.eventQueue).toEqual(TEST_KEYS[TEST_KEYS.length - 3]);
        expect(result.accounts.market).toEqual(TEST_KEYS[TEST_KEYS.length - 4]);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS.slice(0, -4));
    });
});

describe('decodeConsumeEventsPermissioned', () => {
    it('should decode limit and slice openOrders from the leading keys', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.consumeEventsPermissioned, programId);
        const result = decodeConsumeEventsPermissioned(ix);
        expect(result.data.limit).toBe(32);
        expect(result.accounts.crankAuthority).toEqual(TEST_KEYS[TEST_KEYS.length - 1]);
        expect(result.accounts.eventQueue).toEqual(TEST_KEYS[TEST_KEYS.length - 2]);
        expect(result.accounts.market).toEqual(TEST_KEYS[TEST_KEYS.length - 3]);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS.slice(0, -3));
    });
});

describe('decodePrune', () => {
    it('should decode limit and account refs', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.prune, programId);
        const result = decodePrune(ix);
        expect(result.data.limit).toBe(25);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.bids).toEqual(TEST_KEYS[1]);
        expect(result.accounts.asks).toEqual(TEST_KEYS[2]);
        expect(result.accounts.pruneAuthority).toEqual(TEST_KEYS[3]);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS[4]);
        expect(result.accounts.openOrdersOwner).toEqual(TEST_KEYS[5]);
        expect(result.accounts.eventQueue).toEqual(TEST_KEYS[6]);
    });
});

describe('decodeSettleFunds', () => {
    it('should extract account refs and the optional referrer', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.settleFunds, programId);
        const result = decodeSettleFunds(ix);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS[1]);
        expect(result.accounts.openOrdersOwner).toEqual(TEST_KEYS[2]);
        expect(result.accounts.baseVault).toEqual(TEST_KEYS[3]);
        expect(result.accounts.quoteVault).toEqual(TEST_KEYS[4]);
        expect(result.accounts.baseWallet).toEqual(TEST_KEYS[5]);
        expect(result.accounts.quoteWallet).toEqual(TEST_KEYS[6]);
        expect(result.accounts.vaultSigner).toEqual(TEST_KEYS[7]);
        expect(result.accounts.referrerQuoteWallet).toEqual(TEST_KEYS[9]);
    });

    it('should omit referrerQuoteWallet when only 9 keys are provided', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.settleFunds, programId, TEST_KEYS.slice(0, 9));
        const result = decodeSettleFunds(ix);
        expect(result.accounts.referrerQuoteWallet).toBeUndefined();
    });
});

describe('decodeCloseOpenOrders', () => {
    it('should extract account refs', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.closeOpenOrders, programId);
        const result = decodeCloseOpenOrders(ix);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS[0]);
        expect(result.accounts.openOrdersOwner).toEqual(TEST_KEYS[1]);
        expect(result.accounts.rentReceiver).toEqual(TEST_KEYS[2]);
        expect(result.accounts.market).toEqual(TEST_KEYS[3]);
    });
});

describe('decodeInitOpenOrders', () => {
    it('should extract account refs and the optional market authority', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.initOpenOrders, programId);
        const result = decodeInitOpenOrders(ix);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS[0]);
        expect(result.accounts.openOrdersOwner).toEqual(TEST_KEYS[1]);
        expect(result.accounts.market).toEqual(TEST_KEYS[2]);
        expect(result.accounts.openOrdersMarketAuthority).toEqual(TEST_KEYS[4]);
    });

    it('should omit openOrdersMarketAuthority when only 4 keys are provided', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.initOpenOrders, programId, TEST_KEYS.slice(0, 4));
        const result = decodeInitOpenOrders(ix);
        expect(result.accounts.openOrdersMarketAuthority).toBeUndefined();
    });
});

describe('decodeDisableMarket', () => {
    it('should extract market and disable authority refs', () => {
        const ix = makeInstruction(makeRawInstructionData(7), programId);
        const result = decodeDisableMarket(ix);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.disableAuthority).toEqual(TEST_KEYS[1]);
    });
});

describe('decodeSweepFees', () => {
    it('should extract account refs', () => {
        const ix = makeInstruction(makeRawInstructionData(8), programId);
        const result = decodeSweepFees(ix);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.quoteVault).toEqual(TEST_KEYS[1]);
        expect(result.accounts.feeSweepingAuthority).toEqual(TEST_KEYS[2]);
        expect(result.accounts.quoteFeeReceiver).toEqual(TEST_KEYS[3]);
        expect(result.accounts.vaultSigner).toEqual(TEST_KEYS[4]);
    });
});
