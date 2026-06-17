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
} from '../decoder';
import {
    ENCODED_INSTRUCTIONS,
    makeInstruction,
    makeRawInstructionData,
    SERUM_PROGRAM_IDS_BY_NAME,
    TEST_KEYS,
} from './fixtures';

const programId = SERUM_PROGRAM_IDS_BY_NAME.openBook;

// Decoders whose `data` schema relies on BigIntFromString currently throw
// at validation time because @project-serum/serum's u64/u128 layouts decode
// to BN instances, not strings. The current SerumDetailsCard wraps these
// calls in try/catch and falls back to a raw card. The throw is preserved
// here as a regression guard during extraction; future fixes to BigIntFromString
// (e.g. accepting BN.toString()) should update these tests in lockstep.
describe('decoders that currently throw on bigint validation', () => {
    it.each([
        ['decodeInitializeMarket', () => decodeInitializeMarket(makeInstruction(ENCODED_INSTRUCTIONS.initializeMarket, programId))],
        ['decodeNewOrder', () => decodeNewOrder(makeInstruction(ENCODED_INSTRUCTIONS.newOrder, programId))],
        ['decodeNewOrderV3', () => decodeNewOrderV3(makeInstruction(ENCODED_INSTRUCTIONS.newOrderV3, programId))],
        ['decodeCancelOrder', () => decodeCancelOrder(makeInstruction(ENCODED_INSTRUCTIONS.cancelOrder, programId))],
        ['decodeCancelOrderV2', () => decodeCancelOrderV2(makeInstruction(ENCODED_INSTRUCTIONS.cancelOrderV2, programId))],
        ['decodeCancelOrderByClientId', () => decodeCancelOrderByClientId(makeInstruction(ENCODED_INSTRUCTIONS.cancelOrderByClientId, programId))],
        ['decodeCancelOrderByClientIdV2', () => decodeCancelOrderByClientIdV2(makeInstruction(ENCODED_INSTRUCTIONS.cancelOrderByClientIdV2, programId))],
    ] as const)('%s throws StructError on BN bigint coercion', (_name, run) => {
        expect(run).toThrow('Expected a value of type `bigint`');
    });
});

describe('decodeMatchOrders', () => {
    it('decodes limit and account refs', () => {
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
    it('decodes limit and slices openOrders from the leading keys', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.consumeEvents, programId);
        const result = decodeConsumeEvents(ix);
        expect(result.data.limit).toBe(16);
        expect(result.accounts.eventQueue).toEqual(TEST_KEYS[TEST_KEYS.length - 3]);
        expect(result.accounts.market).toEqual(TEST_KEYS[TEST_KEYS.length - 4]);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS.slice(0, -4));
    });
});

describe('decodeConsumeEventsPermissioned', () => {
    it('decodes limit and slices openOrders from the leading keys', () => {
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
    it('decodes limit and account refs', () => {
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
    it('extracts account refs and the optional referrer', () => {
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

    it('omits referrerQuoteWallet when only 9 keys are provided', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.settleFunds, programId, TEST_KEYS.slice(0, 9));
        const result = decodeSettleFunds(ix);
        expect(result.accounts.referrerQuoteWallet).toBeUndefined();
    });
});

describe('decodeCloseOpenOrders', () => {
    it('extracts account refs', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.closeOpenOrders, programId);
        const result = decodeCloseOpenOrders(ix);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS[0]);
        expect(result.accounts.openOrdersOwner).toEqual(TEST_KEYS[1]);
        expect(result.accounts.rentReceiver).toEqual(TEST_KEYS[2]);
        expect(result.accounts.market).toEqual(TEST_KEYS[3]);
    });
});

describe('decodeInitOpenOrders', () => {
    it('extracts account refs and the optional market authority', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.initOpenOrders, programId);
        const result = decodeInitOpenOrders(ix);
        expect(result.accounts.openOrders).toEqual(TEST_KEYS[0]);
        expect(result.accounts.openOrdersOwner).toEqual(TEST_KEYS[1]);
        expect(result.accounts.market).toEqual(TEST_KEYS[2]);
        expect(result.accounts.openOrdersMarketAuthority).toEqual(TEST_KEYS[4]);
    });

    it('omits openOrdersMarketAuthority when only 4 keys are provided', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.initOpenOrders, programId, TEST_KEYS.slice(0, 4));
        const result = decodeInitOpenOrders(ix);
        expect(result.accounts.openOrdersMarketAuthority).toBeUndefined();
    });
});

describe('decodeDisableMarket', () => {
    it('extracts market and disable authority refs', () => {
        const ix = makeInstruction(makeRawInstructionData(7), programId);
        const result = decodeDisableMarket(ix);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.disableAuthority).toEqual(TEST_KEYS[1]);
    });
});

describe('decodeSweepFees', () => {
    it('extracts account refs', () => {
        const ix = makeInstruction(makeRawInstructionData(8), programId);
        const result = decodeSweepFees(ix);
        expect(result.accounts.market).toEqual(TEST_KEYS[0]);
        expect(result.accounts.quoteVault).toEqual(TEST_KEYS[1]);
        expect(result.accounts.feeSweepingAuthority).toEqual(TEST_KEYS[2]);
        expect(result.accounts.quoteFeeReceiver).toEqual(TEST_KEYS[3]);
        expect(result.accounts.vaultSigner).toEqual(TEST_KEYS[4]);
    });
});
