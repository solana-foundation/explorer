import { encodeMangoInstruction } from '@blockworks-foundation/mango-client';
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';

export { MANGO_PROGRAM_IDS } from '../program-ids';

/** Known spot market from mainnet.1 group */
export const SPOT_MARKETS = {
    'BTC/USDC': {
        marketIndex: 1,
        publicKey: new PublicKey('A8YFbxQYFVqKZaoYJLLUVcQiWP7G2MeEgW5wsAQgMvFw'),
    },
    'MNGO/USDC': {
        marketIndex: 0,
        publicKey: new PublicKey('3d4rzwpy9iGdCZvgxcu7B1YocYffVLsQXPXkBZKt2zLc'),
    },
};

/** Known perp market from mainnet.1 group */
export const PERP_MARKETS = {
    'BTC-PERP': {
        marketIndex: 1,
        publicKey: new PublicKey('DtEcjPLyD4YtTBB4q8xwFZ9q49W89xZCZtJyrGebi5t8'),
    },
    'MNGO-PERP': {
        marketIndex: 0,
        publicKey: new PublicKey('4nfmQP3KmUqEJ6qJLsS3offKgE96YUB4Rp7UQvm2Fbi9'),
    },
};

/**
 * Pre-encoded instruction data for each Mango instruction type,
 * built via encodeMangoInstruction() from @blockworks-foundation/mango-client.
 */
export const ENCODED_INSTRUCTIONS = {
    AddPerpMarket: encodeMangoInstruction({
        AddPerpMarket: {
            baseLotSize: new BN(100),
            exp: 0,
            initLeverage: new BN(10),
            liquidationFee: new BN(50),
            maintLeverage: new BN(20),
            makerFee: new BN(5),
            maxDepthBps: new BN(200),
            mngoPerPeriod: new BN(250),
            quoteLotSize: new BN(10),
            rate: new BN(30),
            takerFee: new BN(10),
            targetPeriodLength: new BN(3600),
        },
    }),
    AddSpotMarket: encodeMangoInstruction({
        AddSpotMarket: {
            initLeverage: new BN(5),
            liquidationFee: new BN(100),
            maintLeverage: new BN(10),
            maxRate: new BN(150),
            optimalRate: new BN(80),
            optimalUtil: new BN(70),
        },
    }),
    AddToBasket: encodeMangoInstruction({ AddToBasket: { marketIndex: new BN(2) } }),
    CancelPerpOrder: encodeMangoInstruction({ CancelPerpOrder: { invalidIdOk: false, orderId: new BN(42) } }),
    CancelSpotOrder: encodeMangoInstruction({ CancelSpotOrder: { orderId: new BN(42), side: 'sell' } }),
    ChangePerpMarketParams: encodeMangoInstruction({
        ChangePerpMarketParams: {
            exp: 0,
            expOption: false,
            initLeverage: new BN(10),
            initLeverageOption: true,
            liquidationFee: new BN(0),
            liquidationFeeOption: false,
            maintLeverage: new BN(20),
            maintLeverageOption: true,
            makerFee: new BN(5),
            makerFeeOption: true,
            maxDepthBps: new BN(0),
            maxDepthBpsOption: false,
            mngoPerPeriod: new BN(0),
            mngoPerPeriodOption: false,
            rate: new BN(0),
            rateOption: false,
            takerFee: new BN(10),
            takerFeeOption: true,
            targetPeriodLength: new BN(0),
            targetPeriodLengthOption: false,
        },
    }),
    Deposit: encodeMangoInstruction({ Deposit: { quantity: new BN(1_000_000) } }),
    PlacePerpOrder: encodeMangoInstruction({
        PlacePerpOrder: {
            clientOrderId: new BN(99),
            orderType: 'postOnly',
            price: new BN(50_000),
            quantity: new BN(10),
            reduceOnly: false,
            side: 'buy',
        },
    }),
    PlacePerpOrder2: encodeMangoInstruction({
        PlacePerpOrder2: {
            clientOrderId: new BN(200),
            expiryTimestamp: new BN(1_700_000_000),
            limit: 0,
            maxBaseQuantity: new BN(5),
            maxQuoteQuantity: new BN(0),
            orderType: 'limit',
            price: new BN(60_000),
            reduceOnly: true,
            side: 'sell',
        },
    }),
    PlaceSpotOrder: encodeMangoInstruction({
        PlaceSpotOrder: {
            clientId: new BN(12_345),
            limit: 65_535,
            limitPrice: new BN(42_000),
            maxBaseQuantity: new BN(100),
            maxQuoteQuantity: new BN(4_200_000),
            orderType: 'limit',
            selfTradeBehavior: 'decrementTake',
            side: 'buy',
        },
    }),
    Withdraw: encodeMangoInstruction({ Withdraw: { allowBorrow: new BN(1), quantity: new BN(500_000) } }),
};

/** Create a TransactionInstruction from encoded data and a program ID */
export function makeInstruction(data: Buffer, programId: PublicKey, keys: PublicKey[] = []): TransactionInstruction {
    return new TransactionInstruction({
        data,
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId,
    });
}

export const TEST_KEYS: PublicKey[] = Array.from({ length: 7 }, () => Keypair.generate().publicKey);
