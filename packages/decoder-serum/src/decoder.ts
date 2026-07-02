/* eslint-disable sort-keys-fix/sort-keys-fix -- `accounts` literals and data schemas mirror the on-wire field order so the UI renders fields in instruction order */
import { decodeInstruction } from '@project-serum/serum';
import { type AccountMeta, type PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { enums, type Infer, mask, number, object } from 'superstruct';

import { BigIntFromString } from './superstructHelpers';

export type Side = Infer<typeof Side>;
export const Side = enums(['buy', 'sell']);

export type OrderType = Infer<typeof OrderType>;
export const OrderType = enums(['limit', 'ioc', 'postOnly']);

export type SelfTradeBehavior = Infer<typeof SelfTradeBehavior>;
export const SelfTradeBehavior = enums(['decrementTake', 'cancelProvide', 'abortTransaction']);

function getOptionalKey(keys: AccountMeta[], index: number): PublicKey | undefined {
    if (index < keys.length) {
        return keys[index].pubkey;
    } else {
        return undefined;
    }
}

export type InitializeMarket = {
    programId: PublicKey;
    data: Infer<typeof InitializeMarketInstruction>;
    accounts: {
        market: PublicKey;
        requestQueue: PublicKey;
        eventQueue: PublicKey;
        bids: PublicKey;
        asks: PublicKey;
        baseVault: PublicKey;
        quoteVault: PublicKey;
        baseMint: PublicKey;
        quoteMint: PublicKey;
        openOrdersMarketAuthority?: PublicKey;
        pruneAuthority?: PublicKey;
        crankAuthority?: PublicKey;
    };
};

export const InitializeMarketInstruction = object({
    baseLotSize: BigIntFromString,
    quoteLotSize: BigIntFromString,
    feeRateBps: number(),
    vaultSignerNonce: BigIntFromString,
    quoteDustThreshold: BigIntFromString,
});

export function decodeInitializeMarket(ix: TransactionInstruction): InitializeMarket {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            requestQueue: ix.keys[1].pubkey,
            eventQueue: ix.keys[2].pubkey,
            bids: ix.keys[3].pubkey,
            asks: ix.keys[4].pubkey,
            baseVault: ix.keys[5].pubkey,
            quoteVault: ix.keys[6].pubkey,
            baseMint: ix.keys[7].pubkey,
            quoteMint: ix.keys[8].pubkey,
            openOrdersMarketAuthority: getOptionalKey(ix.keys, 10),
            pruneAuthority: getOptionalKey(ix.keys, 11),
            crankAuthority: getOptionalKey(ix.keys, 12),
        },
        data: mask(decodeInstruction(ix.data).initializeMarket, InitializeMarketInstruction),
        programId: ix.programId,
    };
}

export type NewOrder = {
    programId: PublicKey;
    data: Infer<typeof NewOrderInstruction>;
    accounts: {
        market: PublicKey;
        openOrders: PublicKey;
        requestQueue: PublicKey;
        payer: PublicKey;
        openOrdersOwner: PublicKey;
        baseVault: PublicKey;
        quoteVault: PublicKey;
        feeDiscountPubkey?: PublicKey;
    };
};

export const NewOrderInstruction = object({
    side: Side,
    limitPrice: BigIntFromString,
    maxQuantity: BigIntFromString,
    orderType: OrderType,
    clientId: BigIntFromString,
});

export function decodeNewOrder(ix: TransactionInstruction): NewOrder {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            openOrders: ix.keys[1].pubkey,
            requestQueue: ix.keys[2].pubkey,
            payer: ix.keys[3].pubkey,
            openOrdersOwner: ix.keys[4].pubkey,
            baseVault: ix.keys[5].pubkey,
            quoteVault: ix.keys[6].pubkey,
            feeDiscountPubkey: getOptionalKey(ix.keys, 9),
        },
        data: mask(decodeInstruction(ix.data).newOrder, NewOrderInstruction),
        programId: ix.programId,
    };
}

export type MatchOrders = {
    programId: PublicKey;
    data: Infer<typeof MatchOrdersInstruction>;
    accounts: {
        market: PublicKey;
        requestQueue: PublicKey;
        eventQueue: PublicKey;
        bids: PublicKey;
        asks: PublicKey;
    };
};

export const MatchOrdersInstruction = object({
    limit: number(),
});

export function decodeMatchOrders(ix: TransactionInstruction): MatchOrders {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            requestQueue: ix.keys[1].pubkey,
            eventQueue: ix.keys[2].pubkey,
            bids: ix.keys[3].pubkey,
            asks: ix.keys[4].pubkey,
        },
        data: mask(decodeInstruction(ix.data).matchOrders, MatchOrdersInstruction),
        programId: ix.programId,
    };
}

export type ConsumeEvents = {
    programId: PublicKey;
    data: Infer<typeof ConsumeEventsInstruction>;
    accounts: {
        openOrders: PublicKey[];
        market: PublicKey;
        eventQueue: PublicKey;
    };
};

export const ConsumeEventsInstruction = object({
    limit: number(),
});

export function decodeConsumeEvents(ix: TransactionInstruction): ConsumeEvents {
    return {
        accounts: {
            openOrders: ix.keys.slice(0, -4).map(k => k.pubkey),
            market: ix.keys[ix.keys.length - 4].pubkey,
            eventQueue: ix.keys[ix.keys.length - 3].pubkey,
        },
        data: mask(decodeInstruction(ix.data).consumeEvents, ConsumeEventsInstruction),
        programId: ix.programId,
    };
}

export type CancelOrder = {
    programId: PublicKey;
    data: Infer<typeof CancelOrderInstruction>;
    accounts: {
        market: PublicKey;
        openOrders: PublicKey;
        requestQueue: PublicKey;
        openOrdersOwner: PublicKey;
    };
};

export const CancelOrderInstruction = object({
    side: Side,
    orderId: BigIntFromString,
    openOrdersSlot: number(),
});

export function decodeCancelOrder(ix: TransactionInstruction): CancelOrder {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            openOrders: ix.keys[1].pubkey,
            requestQueue: ix.keys[2].pubkey,
            openOrdersOwner: ix.keys[3].pubkey,
        },
        data: mask(decodeInstruction(ix.data).cancelOrder, CancelOrderInstruction),
        programId: ix.programId,
    };
}

export type SettleFunds = {
    programId: PublicKey;
    accounts: {
        market: PublicKey;
        openOrders: PublicKey;
        openOrdersOwner: PublicKey;
        baseVault: PublicKey;
        quoteVault: PublicKey;
        baseWallet: PublicKey;
        quoteWallet: PublicKey;
        vaultSigner: PublicKey;
        referrerQuoteWallet?: PublicKey;
    };
};

export function decodeSettleFunds(ix: TransactionInstruction): SettleFunds {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            openOrders: ix.keys[1].pubkey,
            openOrdersOwner: ix.keys[2].pubkey,
            baseVault: ix.keys[3].pubkey,
            quoteVault: ix.keys[4].pubkey,
            baseWallet: ix.keys[5].pubkey,
            quoteWallet: ix.keys[6].pubkey,
            vaultSigner: ix.keys[7].pubkey,
            referrerQuoteWallet: getOptionalKey(ix.keys, 9),
        },
        programId: ix.programId,
    };
}

export type CancelOrderByClientId = {
    programId: PublicKey;
    data: Infer<typeof CancelOrderByClientIdInstruction>;
    accounts: {
        market: PublicKey;
        openOrders: PublicKey;
        requestQueue: PublicKey;
        openOrdersOwner: PublicKey;
    };
};

export const CancelOrderByClientIdInstruction = object({
    clientId: BigIntFromString,
});

export function decodeCancelOrderByClientId(ix: TransactionInstruction): CancelOrderByClientId {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            openOrders: ix.keys[1].pubkey,
            requestQueue: ix.keys[2].pubkey,
            openOrdersOwner: ix.keys[3].pubkey,
        },
        data: mask(decodeInstruction(ix.data).cancelOrderByClientId, CancelOrderByClientIdInstruction),
        programId: ix.programId,
    };
}

export type DisableMarket = {
    programId: PublicKey;
    accounts: {
        market: PublicKey;
        disableAuthority: PublicKey;
    };
};

export function decodeDisableMarket(ix: TransactionInstruction): DisableMarket {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            disableAuthority: ix.keys[1].pubkey,
        },
        programId: ix.programId,
    };
}

export type SweepFees = {
    programId: PublicKey;
    accounts: {
        market: PublicKey;
        quoteVault: PublicKey;
        feeSweepingAuthority: PublicKey;
        quoteFeeReceiver: PublicKey;
        vaultSigner: PublicKey;
    };
};

export function decodeSweepFees(ix: TransactionInstruction): SweepFees {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            quoteVault: ix.keys[1].pubkey,
            feeSweepingAuthority: ix.keys[2].pubkey,
            quoteFeeReceiver: ix.keys[3].pubkey,
            vaultSigner: ix.keys[4].pubkey,
        },
        programId: ix.programId,
    };
}

export type NewOrderV3 = {
    programId: PublicKey;
    data: Infer<typeof NewOrderV3Instruction>;
    accounts: {
        market: PublicKey;
        openOrders: PublicKey;
        requestQueue: PublicKey;
        eventQueue: PublicKey;
        bids: PublicKey;
        asks: PublicKey;
        payer: PublicKey;
        openOrdersOwner: PublicKey;
        baseVault: PublicKey;
        quoteVault: PublicKey;
        feeDiscountPubkey?: PublicKey;
    };
};

export const NewOrderV3Instruction = object({
    side: Side,
    limitPrice: BigIntFromString,
    maxBaseQuantity: BigIntFromString,
    maxQuoteQuantity: BigIntFromString,
    selfTradeBehavior: SelfTradeBehavior,
    orderType: OrderType,
    clientId: BigIntFromString,
    limit: number(),
});

export function decodeNewOrderV3(ix: TransactionInstruction): NewOrderV3 {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            openOrders: ix.keys[1].pubkey,
            requestQueue: ix.keys[2].pubkey,
            eventQueue: ix.keys[3].pubkey,
            bids: ix.keys[4].pubkey,
            asks: ix.keys[5].pubkey,
            payer: ix.keys[6].pubkey,
            openOrdersOwner: ix.keys[7].pubkey,
            baseVault: ix.keys[8].pubkey,
            quoteVault: ix.keys[9].pubkey,
            feeDiscountPubkey: getOptionalKey(ix.keys, 12),
        },
        data: mask(decodeInstruction(ix.data).newOrderV3, NewOrderV3Instruction),
        programId: ix.programId,
    };
}

export type CancelOrderV2 = {
    programId: PublicKey;
    data: Infer<typeof CancelOrderV2Instruction>;
    accounts: {
        market: PublicKey;
        bids: PublicKey;
        asks: PublicKey;
        openOrders: PublicKey;
        openOrdersOwner: PublicKey;
        eventQueue: PublicKey;
    };
};

export const CancelOrderV2Instruction = object({
    side: Side,
    orderId: BigIntFromString,
});

export function decodeCancelOrderV2(ix: TransactionInstruction): CancelOrderV2 {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            bids: ix.keys[1].pubkey,
            asks: ix.keys[2].pubkey,
            openOrders: ix.keys[3].pubkey,
            openOrdersOwner: ix.keys[4].pubkey,
            eventQueue: ix.keys[5].pubkey,
        },
        data: mask(decodeInstruction(ix.data).cancelOrderV2, CancelOrderV2Instruction),
        programId: ix.programId,
    };
}

export type CancelOrderByClientIdV2 = {
    programId: PublicKey;
    data: Infer<typeof CancelOrderByClientIdV2Instruction>;
    accounts: {
        market: PublicKey;
        bids: PublicKey;
        asks: PublicKey;
        openOrders: PublicKey;
        openOrdersOwner: PublicKey;
        eventQueue: PublicKey;
    };
};

export const CancelOrderByClientIdV2Instruction = object({
    clientId: BigIntFromString,
});

export function decodeCancelOrderByClientIdV2(ix: TransactionInstruction): CancelOrderByClientIdV2 {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            bids: ix.keys[1].pubkey,
            asks: ix.keys[2].pubkey,
            openOrders: ix.keys[3].pubkey,
            openOrdersOwner: ix.keys[4].pubkey,
            eventQueue: ix.keys[5].pubkey,
        },
        data: mask(decodeInstruction(ix.data).cancelOrderByClientIdV2, CancelOrderByClientIdV2Instruction),
        programId: ix.programId,
    };
}

export type CloseOpenOrders = {
    programId: PublicKey;
    accounts: {
        openOrders: PublicKey;
        openOrdersOwner: PublicKey;
        rentReceiver: PublicKey;
        market: PublicKey;
    };
};

export function decodeCloseOpenOrders(ix: TransactionInstruction): CloseOpenOrders {
    return {
        accounts: {
            openOrders: ix.keys[0].pubkey,
            openOrdersOwner: ix.keys[1].pubkey,
            rentReceiver: ix.keys[2].pubkey,
            market: ix.keys[3].pubkey,
        },
        programId: ix.programId,
    };
}

export type InitOpenOrders = {
    programId: PublicKey;
    accounts: {
        openOrders: PublicKey;
        openOrdersOwner: PublicKey;
        market: PublicKey;
        openOrdersMarketAuthority?: PublicKey;
    };
};

export function decodeInitOpenOrders(ix: TransactionInstruction): InitOpenOrders {
    return {
        accounts: {
            openOrders: ix.keys[0].pubkey,
            openOrdersOwner: ix.keys[1].pubkey,
            market: ix.keys[2].pubkey,
            openOrdersMarketAuthority: ix.keys[4]?.pubkey,
        },
        programId: ix.programId,
    };
}

export type Prune = {
    programId: PublicKey;
    data: Infer<typeof PruneInstruction>;
    accounts: {
        market: PublicKey;
        bids: PublicKey;
        asks: PublicKey;
        pruneAuthority: PublicKey;
        openOrders: PublicKey;
        openOrdersOwner: PublicKey;
        eventQueue: PublicKey;
    };
};

export const PruneInstruction = object({
    limit: number(),
});

export function decodePrune(ix: TransactionInstruction): Prune {
    return {
        accounts: {
            market: ix.keys[0].pubkey,
            bids: ix.keys[1].pubkey,
            asks: ix.keys[2].pubkey,
            pruneAuthority: ix.keys[3].pubkey,
            openOrders: ix.keys[4].pubkey,
            openOrdersOwner: ix.keys[5].pubkey,
            eventQueue: ix.keys[6].pubkey,
        },
        data: mask(decodeInstruction(ix.data).prune, PruneInstruction),
        programId: ix.programId,
    };
}

export type ConsumeEventsPermissioned = {
    programId: PublicKey;
    data: Infer<typeof ConsumeEventsPermissionedInstruction>;
    accounts: {
        openOrders: PublicKey[];
        market: PublicKey;
        eventQueue: PublicKey;
        crankAuthority: PublicKey;
    };
};

export const ConsumeEventsPermissionedInstruction = object({
    limit: number(),
});

export function decodeConsumeEventsPermissioned(ix: TransactionInstruction): ConsumeEventsPermissioned {
    return {
        accounts: {
            openOrders: ix.keys.slice(0, -3).map(k => k.pubkey),
            market: ix.keys[ix.keys.length - 3].pubkey,
            eventQueue: ix.keys[ix.keys.length - 2].pubkey,
            crankAuthority: ix.keys[ix.keys.length - 1].pubkey,
        },
        data: mask(decodeInstruction(ix.data).consumeEventsPermissioned, ConsumeEventsPermissionedInstruction),
        programId: ix.programId,
    };
}

export function parseSerumInstructionKey(instruction: TransactionInstruction): string {
    const decoded = decodeInstruction(instruction.data);
    const keys = Object.keys(decoded);

    if (keys.length < 1) {
        throw new Error('Serum instruction key not decoded');
    }

    return keys[0];
}

export type DecodedSerumInstruction =
    | { key: 'cancelOrder'; info: CancelOrder }
    | { key: 'cancelOrderByClientId'; info: CancelOrderByClientId }
    | { key: 'cancelOrderByClientIdV2'; info: CancelOrderByClientIdV2 }
    | { key: 'cancelOrderV2'; info: CancelOrderV2 }
    | { key: 'closeOpenOrders'; info: CloseOpenOrders }
    | { key: 'consumeEvents'; info: ConsumeEvents }
    | { key: 'consumeEventsPermissioned'; info: ConsumeEventsPermissioned }
    | { key: 'disableMarket'; info: DisableMarket }
    | { key: 'initializeMarket'; info: InitializeMarket }
    | { key: 'initOpenOrders'; info: InitOpenOrders }
    | { key: 'matchOrders'; info: MatchOrders }
    | { key: 'newOrder'; info: NewOrder }
    | { key: 'newOrderV3'; info: NewOrderV3 }
    | { key: 'prune'; info: Prune }
    | { key: 'settleFunds'; info: SettleFunds }
    | { key: 'sweepFees'; info: SweepFees };

// Single decode entry point so representation code never dispatches on instruction internals itself.
export function decodeSerumInstruction(instruction: TransactionInstruction): DecodedSerumInstruction {
    const key = parseSerumInstructionKey(instruction);
    switch (key) {
        case 'cancelOrder':
            return { info: decodeCancelOrder(instruction), key };
        case 'cancelOrderByClientId':
            return { info: decodeCancelOrderByClientId(instruction), key };
        case 'cancelOrderByClientIdV2':
            return { info: decodeCancelOrderByClientIdV2(instruction), key };
        case 'cancelOrderV2':
            return { info: decodeCancelOrderV2(instruction), key };
        case 'closeOpenOrders':
            return { info: decodeCloseOpenOrders(instruction), key };
        case 'consumeEvents':
            return { info: decodeConsumeEvents(instruction), key };
        case 'consumeEventsPermissioned':
            return { info: decodeConsumeEventsPermissioned(instruction), key };
        case 'disableMarket':
            return { info: decodeDisableMarket(instruction), key };
        case 'initializeMarket':
            return { info: decodeInitializeMarket(instruction), key };
        case 'initOpenOrders':
            return { info: decodeInitOpenOrders(instruction), key };
        case 'matchOrders':
            return { info: decodeMatchOrders(instruction), key };
        case 'newOrder':
            return { info: decodeNewOrder(instruction), key };
        case 'newOrderV3':
            return { info: decodeNewOrderV3(instruction), key };
        case 'prune':
            return { info: decodePrune(instruction), key };
        case 'settleFunds':
            return { info: decodeSettleFunds(instruction), key };
        case 'sweepFees':
            return { info: decodeSweepFees(instruction), key };
        default:
            throw new Error(`Unsupported Serum instruction key: ${key}`);
    }
}
