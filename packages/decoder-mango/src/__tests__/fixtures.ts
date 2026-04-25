import { encodeMangoInstruction } from '@blockworks-foundation/mango-client';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';

/** Known Mango v3 program IDs from Config.ids() */
export const MANGO_PROGRAM_IDS = {
    devnet: new PublicKey('4skJ85cdxQAFVKbcGgfun8iZPL7BadVYXG3kGEGkufqA'),
    mainnet: new PublicKey('mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68'),
    testnet: new PublicKey('BXhdkETgbHrr5QmVBT1xbz3JrMM28u5djbVtmTUfmFTH'),
};

/** Known spot market from mainnet.1 group */
export const SPOT_MARKETS = {
    'MNGO/USDC': {
        marketIndex: 0,
        publicKey: new PublicKey('3d4rzwpy9iGdCZvgxcu7B1YocYffVLsQXPXkBZKt2zLc'),
    },
    'BTC/USDC': {
        marketIndex: 1,
        publicKey: new PublicKey('A8YFbxQYFVqKZaoYJLLUVcQiWP7G2MeEgW5wsAQgMvFw'),
    },
};

/** Known perp market from mainnet.1 group */
export const PERP_MARKETS = {
    'MNGO-PERP': {
        marketIndex: 0,
        publicKey: new PublicKey('4nfmQP3KmUqEJ6qJLsS3offKgE96YUB4Rp7UQvm2Fbi9'),
    },
    'BTC-PERP': {
        marketIndex: 1,
        publicKey: new PublicKey('DtEcjPLyD4YtTBB4q8xwFZ9q49W89xZCZtJyrGebi5t8'),
    },
};

/**
 * Pre-encoded instruction data for each Mango instruction type,
 * built via encodeMangoInstruction() from @blockworks-foundation/mango-client.
 */
export const ENCODED_INSTRUCTIONS = {
    Deposit: encodeMangoInstruction({ Deposit: { quantity: new BN(1_000_000) } }),
    Withdraw: encodeMangoInstruction({ Withdraw: { quantity: new BN(500_000), allowBorrow: new BN(1) } }),
    AddToBasket: encodeMangoInstruction({ AddToBasket: { marketIndex: new BN(2) } }),
    PlaceSpotOrder: encodeMangoInstruction({
        PlaceSpotOrder: {
            side: 'buy',
            limitPrice: new BN(42_000),
            maxBaseQuantity: new BN(100),
            maxQuoteQuantity: new BN(4_200_000),
            selfTradeBehavior: 'decrementTake',
            orderType: 'limit',
            clientId: new BN(12_345),
            limit: 65_535,
        },
    }),
    CancelSpotOrder: encodeMangoInstruction({ CancelSpotOrder: { side: 'sell', orderId: new BN(42) } }),
    PlacePerpOrder: encodeMangoInstruction({
        PlacePerpOrder: {
            price: new BN(50_000),
            quantity: new BN(10),
            clientOrderId: new BN(99),
            side: 'buy',
            orderType: 'postOnly',
            reduceOnly: false,
        },
    }),
    PlacePerpOrder2: encodeMangoInstruction({
        PlacePerpOrder2: {
            price: new BN(60_000),
            maxBaseQuantity: new BN(5),
            maxQuoteQuantity: new BN(0),
            clientOrderId: new BN(200),
            expiryTimestamp: new BN(1_700_000_000),
            side: 'sell',
            orderType: 'limit',
            reduceOnly: true,
            limit: 0,
        },
    }),
    CancelPerpOrder: encodeMangoInstruction({ CancelPerpOrder: { orderId: new BN(42), invalidIdOk: false } }),
    AddSpotMarket: encodeMangoInstruction({
        AddSpotMarket: {
            maintLeverage: new BN(10),
            initLeverage: new BN(5),
            liquidationFee: new BN(100),
            optimalUtil: new BN(70),
            optimalRate: new BN(80),
            maxRate: new BN(150),
        },
    }),
    AddPerpMarket: encodeMangoInstruction({
        AddPerpMarket: {
            maintLeverage: new BN(20),
            initLeverage: new BN(10),
            liquidationFee: new BN(50),
            makerFee: new BN(5),
            takerFee: new BN(10),
            baseLotSize: new BN(100),
            quoteLotSize: new BN(10),
            rate: new BN(30),
            maxDepthBps: new BN(200),
            targetPeriodLength: new BN(3600),
            mngoPerPeriod: new BN(250),
            exp: 0,
        },
    }),
    ChangePerpMarketParams: encodeMangoInstruction({
        ChangePerpMarketParams: {
            maintLeverageOption: true,
            maintLeverage: new BN(20),
            initLeverageOption: true,
            initLeverage: new BN(10),
            liquidationFeeOption: false,
            liquidationFee: new BN(0),
            makerFeeOption: true,
            makerFee: new BN(5),
            takerFeeOption: true,
            takerFee: new BN(10),
            rateOption: false,
            rate: new BN(0),
            maxDepthBpsOption: false,
            maxDepthBps: new BN(0),
            targetPeriodLengthOption: false,
            targetPeriodLength: new BN(0),
            mngoPerPeriodOption: false,
            mngoPerPeriod: new BN(0),
            expOption: false,
            exp: 0,
        },
    }),
};

/** Create a TransactionInstruction from encoded data and a program ID */
export function makeInstruction(data: Buffer, programId: PublicKey, keys: PublicKey[] = []): TransactionInstruction {
    return new TransactionInstruction({
        data,
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId,
    });
}
