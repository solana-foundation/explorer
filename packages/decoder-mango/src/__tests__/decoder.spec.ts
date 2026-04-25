import { describe, expect, it } from 'vitest';

import {
    decodeAddPerpMarket,
    decodeAddSpotMarket,
    decodeAddToBasket,
    decodeCancelPerpOrder,
    decodeCancelSpotOrder,
    decodeChangePerpMarketParams,
    decodeDeposit,
    decodePlacePerpOrder,
    decodePlacePerpOrder2,
    decodePlaceSpotOrder,
    decodeWithdraw,
} from '../decoder';
import { ENCODED_INSTRUCTIONS, MANGO_PROGRAM_IDS, makeInstruction } from './fixtures';

const programId = MANGO_PROGRAM_IDS.mainnet;

describe('decodeDeposit', () => {
    it('should decode quantity', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, programId);
        const result = decodeDeposit(ix);
        expect(result.quantity).toBe(1_000_000);
    });
});

describe('decodeWithdraw', () => {
    it('should decode quantity and allowBorrow', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Withdraw, programId);
        const result = decodeWithdraw(ix);
        expect(result.quantity).toBe(500_000);
        expect(result.allowBorrow).toBe('1');
    });
});

describe('decodeAddToBasket', () => {
    it('should decode marketIndex', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.AddToBasket, programId);
        const result = decodeAddToBasket(ix);
        expect(result.marketIndex).toBe(2);
    });
});

describe('decodePlaceSpotOrder', () => {
    it('should decode all fields', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.PlaceSpotOrder, programId);
        const result = decodePlaceSpotOrder(ix);
        expect(result.side).toBe('buy');
        expect(result.limitPrice).toBe(42000);
        expect(result.maxBaseQuantity).toBe(100);
        expect(result.maxQuoteQuantity).toBe(4_200_000);
        expect(result.selfTradeBehavior).toBe('decrementTake');
        expect(result.orderType).toBe('limit');
        expect(result.clientId).toBe('12345');
        expect(result.limit).toBe('65535');
    });
});

describe('decodeCancelSpotOrder', () => {
    it('should decode orderId and side', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.CancelSpotOrder, programId);
        const result = decodeCancelSpotOrder(ix);
        expect(result.side).toBe('sell');
        expect(result.orderId).toBe('42');
    });
});

describe('decodePlacePerpOrder', () => {
    it('should decode all fields', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.PlacePerpOrder, programId);
        const result = decodePlacePerpOrder(ix);
        expect(result.price).toBe(50000);
        expect(result.quantity).toBe(10);
        expect(result.clientOrderId).toBe('99');
        expect(result.side).toBe('buy');
        expect(result.orderType).toBe('postOnly');
        // reduceOnly is a boolean in the layout, .toString() produces "false"
        expect(result.reduceOnly).toBe('false');
    });
});

describe('decodePlacePerpOrder2', () => {
    it('should decode all fields', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.PlacePerpOrder2, programId);
        const result = decodePlacePerpOrder2(ix);
        expect(result.price).toBe(60000);
        expect(result.maxBaseQuantity).toBe(5);
        expect(result.clientOrderId).toBe('200');
        expect(result.side).toBe('sell');
        expect(result.orderType).toBe('limit');
        // reduceOnly is a boolean in the layout, encoded as true
        expect(result.reduceOnly).toBe('true');
        expect(result.expiryTimestamp).toBe(1_700_000_000);
    });
});

describe('decodeCancelPerpOrder', () => {
    it('should decode orderId and invalidIdOk', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.CancelPerpOrder, programId);
        const result = decodeCancelPerpOrder(ix);
        expect(result.orderId).toBe('42');
        // invalidIdOk is a boolean in the layout, .toString() produces "false"
        expect(result.invalidIdOk).toBe('false');
    });
});

// Both AddSpotMarket and AddPerpMarket layouts lack a marketIndex field (it comes
// from account keys), so the decoder throws when accessing .marketIndex.toNumber().
describe.each([
    ['decodeAddSpotMarket', decodeAddSpotMarket, ENCODED_INSTRUCTIONS.AddSpotMarket],
    ['decodeAddPerpMarket', decodeAddPerpMarket, ENCODED_INSTRUCTIONS.AddPerpMarket],
] as const)('%s', (_name, decodeFn, data) => {
    it('should throw because layout does not include marketIndex field', () => {
        const ix = makeInstruction(data, programId);
        expect(() => decodeFn(ix)).toThrow();
    });
});

describe('decodeChangePerpMarketParams', () => {
    it('should decode option flags and values', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.ChangePerpMarketParams, programId);
        const result = decodeChangePerpMarketParams(ix);
        expect(result.maintLeverageOption).toBe(true);
        expect(result.initLeverageOption).toBe(true);
        expect(result.liquidationFeeOption).toBe(false);
        expect(result.makerFeeOption).toBe(true);
        expect(result.takerFeeOption).toBe(true);
        expect(result.rateOption).toBe(false);
        expect(result.maxDepthBpsOption).toBe(false);
        expect(result.targetPeriodLengthOption).toBe(false);
        expect(result.mngoPerPeriodOption).toBe(false);
    });
});
