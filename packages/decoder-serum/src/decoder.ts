/* eslint-disable sort-keys-fix/sort-keys-fix -- `accounts` literal order drives UI row order (Object.entries); data schemas are kept in wire order only to mirror the layout */
import {
    type AccountMeta,
    type Address,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
    type ReadonlyUint8Array,
} from '@solana/kit';
import { bigint, enums, type Infer, mask, number, object } from 'superstruct';

import { decodeInstruction } from './instruction-layout';

/** The kit instruction shape every decoder reads: the payload bytes plus the ordered account list. */
export type SerumInstruction = Instruction<string> &
    InstructionWithAccounts<readonly AccountMeta[]> &
    InstructionWithData<ReadonlyUint8Array>;

export type Side = Infer<typeof Side>;
export const Side = enums(['buy', 'sell']);

export type OrderType = Infer<typeof OrderType>;
export const OrderType = enums(['limit', 'ioc', 'postOnly']);

export type SelfTradeBehavior = Infer<typeof SelfTradeBehavior>;
export const SelfTradeBehavior = enums(['decrementTake', 'cancelProvide', 'abortTransaction']);

function getOptionalKey(accounts: readonly AccountMeta[], index: number): Address | undefined {
    if (index < accounts.length) {
        return accounts[index].address;
    } else {
        return undefined;
    }
}

export type InitializeMarket = {
    data: Infer<typeof InitializeMarketInstruction>;
    accounts: {
        market: Address;
        requestQueue: Address;
        eventQueue: Address;
        bids: Address;
        asks: Address;
        baseVault: Address;
        quoteVault: Address;
        baseMint: Address;
        quoteMint: Address;
        openOrdersMarketAuthority?: Address;
        pruneAuthority?: Address;
        crankAuthority?: Address;
    };
};

export const InitializeMarketInstruction = object({
    baseLotSize: bigint(),
    quoteLotSize: bigint(),
    feeRateBps: number(),
    vaultSignerNonce: bigint(),
    quoteDustThreshold: bigint(),
});

export function decodeInitializeMarket(ix: SerumInstruction): InitializeMarket {
    return {
        accounts: {
            market: ix.accounts[0].address,
            requestQueue: ix.accounts[1].address,
            eventQueue: ix.accounts[2].address,
            bids: ix.accounts[3].address,
            asks: ix.accounts[4].address,
            baseVault: ix.accounts[5].address,
            quoteVault: ix.accounts[6].address,
            baseMint: ix.accounts[7].address,
            quoteMint: ix.accounts[8].address,
            openOrdersMarketAuthority: getOptionalKey(ix.accounts, 10),
            pruneAuthority: getOptionalKey(ix.accounts, 11),
            crankAuthority: getOptionalKey(ix.accounts, 12),
        },
        data: mask(decodeInstruction(ix.data).initializeMarket, InitializeMarketInstruction),
    };
}

export type NewOrder = {
    data: Infer<typeof NewOrderInstruction>;
    accounts: {
        market: Address;
        openOrders: Address;
        requestQueue: Address;
        payer: Address;
        openOrdersOwner: Address;
        baseVault: Address;
        quoteVault: Address;
        feeDiscountPubkey?: Address;
    };
};

export const NewOrderInstruction = object({
    side: Side,
    limitPrice: bigint(),
    maxQuantity: bigint(),
    orderType: OrderType,
    clientId: bigint(),
});

export function decodeNewOrder(ix: SerumInstruction): NewOrder {
    return {
        accounts: {
            market: ix.accounts[0].address,
            openOrders: ix.accounts[1].address,
            requestQueue: ix.accounts[2].address,
            payer: ix.accounts[3].address,
            openOrdersOwner: ix.accounts[4].address,
            baseVault: ix.accounts[5].address,
            quoteVault: ix.accounts[6].address,
            feeDiscountPubkey: getOptionalKey(ix.accounts, 9),
        },
        data: mask(decodeInstruction(ix.data).newOrder, NewOrderInstruction),
    };
}

export type MatchOrders = {
    data: Infer<typeof MatchOrdersInstruction>;
    accounts: {
        market: Address;
        requestQueue: Address;
        eventQueue: Address;
        bids: Address;
        asks: Address;
    };
};

export const MatchOrdersInstruction = object({
    limit: number(),
});

export function decodeMatchOrders(ix: SerumInstruction): MatchOrders {
    return {
        accounts: {
            market: ix.accounts[0].address,
            requestQueue: ix.accounts[1].address,
            eventQueue: ix.accounts[2].address,
            bids: ix.accounts[3].address,
            asks: ix.accounts[4].address,
        },
        data: mask(decodeInstruction(ix.data).matchOrders, MatchOrdersInstruction),
    };
}

export type ConsumeEvents = {
    data: Infer<typeof ConsumeEventsInstruction>;
    accounts: {
        openOrders: Address[];
        market: Address;
        eventQueue: Address;
    };
};

export const ConsumeEventsInstruction = object({
    limit: number(),
});

export function decodeConsumeEvents(ix: SerumInstruction): ConsumeEvents {
    return {
        accounts: {
            openOrders: ix.accounts.slice(0, -4).map(account => account.address),
            market: ix.accounts[ix.accounts.length - 4].address,
            eventQueue: ix.accounts[ix.accounts.length - 3].address,
        },
        data: mask(decodeInstruction(ix.data).consumeEvents, ConsumeEventsInstruction),
    };
}

export type CancelOrder = {
    data: Infer<typeof CancelOrderInstruction>;
    accounts: {
        market: Address;
        openOrders: Address;
        requestQueue: Address;
        openOrdersOwner: Address;
    };
};

export const CancelOrderInstruction = object({
    side: Side,
    orderId: bigint(),
    openOrdersSlot: number(),
});

export function decodeCancelOrder(ix: SerumInstruction): CancelOrder {
    return {
        accounts: {
            market: ix.accounts[0].address,
            openOrders: ix.accounts[1].address,
            requestQueue: ix.accounts[2].address,
            openOrdersOwner: ix.accounts[3].address,
        },
        data: mask(decodeInstruction(ix.data).cancelOrder, CancelOrderInstruction),
    };
}

export type SettleFunds = {
    accounts: {
        market: Address;
        openOrders: Address;
        openOrdersOwner: Address;
        baseVault: Address;
        quoteVault: Address;
        baseWallet: Address;
        quoteWallet: Address;
        vaultSigner: Address;
        referrerQuoteWallet?: Address;
    };
};

export function decodeSettleFunds(ix: SerumInstruction): SettleFunds {
    return {
        accounts: {
            market: ix.accounts[0].address,
            openOrders: ix.accounts[1].address,
            openOrdersOwner: ix.accounts[2].address,
            baseVault: ix.accounts[3].address,
            quoteVault: ix.accounts[4].address,
            baseWallet: ix.accounts[5].address,
            quoteWallet: ix.accounts[6].address,
            vaultSigner: ix.accounts[7].address,
            referrerQuoteWallet: getOptionalKey(ix.accounts, 9),
        },
    };
}

export type CancelOrderByClientId = {
    data: Infer<typeof CancelOrderByClientIdInstruction>;
    accounts: {
        market: Address;
        openOrders: Address;
        requestQueue: Address;
        openOrdersOwner: Address;
    };
};

export const CancelOrderByClientIdInstruction = object({
    clientId: bigint(),
});

export function decodeCancelOrderByClientId(ix: SerumInstruction): CancelOrderByClientId {
    return {
        accounts: {
            market: ix.accounts[0].address,
            openOrders: ix.accounts[1].address,
            requestQueue: ix.accounts[2].address,
            openOrdersOwner: ix.accounts[3].address,
        },
        data: mask(decodeInstruction(ix.data).cancelOrderByClientId, CancelOrderByClientIdInstruction),
    };
}

export type NewOrderV3 = {
    data: Infer<typeof NewOrderV3Instruction>;
    accounts: {
        market: Address;
        openOrders: Address;
        requestQueue: Address;
        eventQueue: Address;
        bids: Address;
        asks: Address;
        payer: Address;
        openOrdersOwner: Address;
        baseVault: Address;
        quoteVault: Address;
        feeDiscountPubkey?: Address;
    };
};

export const NewOrderV3Instruction = object({
    side: Side,
    limitPrice: bigint(),
    maxBaseQuantity: bigint(),
    maxQuoteQuantity: bigint(),
    selfTradeBehavior: SelfTradeBehavior,
    orderType: OrderType,
    clientId: bigint(),
    limit: number(),
});

export function decodeNewOrderV3(ix: SerumInstruction): NewOrderV3 {
    return {
        accounts: {
            market: ix.accounts[0].address,
            openOrders: ix.accounts[1].address,
            requestQueue: ix.accounts[2].address,
            eventQueue: ix.accounts[3].address,
            bids: ix.accounts[4].address,
            asks: ix.accounts[5].address,
            payer: ix.accounts[6].address,
            openOrdersOwner: ix.accounts[7].address,
            baseVault: ix.accounts[8].address,
            quoteVault: ix.accounts[9].address,
            feeDiscountPubkey: getOptionalKey(ix.accounts, 12),
        },
        data: mask(decodeInstruction(ix.data).newOrderV3, NewOrderV3Instruction),
    };
}

export type CancelOrderV2 = {
    data: Infer<typeof CancelOrderV2Instruction>;
    accounts: {
        market: Address;
        bids: Address;
        asks: Address;
        openOrders: Address;
        openOrdersOwner: Address;
        eventQueue: Address;
    };
};

export const CancelOrderV2Instruction = object({
    side: Side,
    orderId: bigint(),
});

export function decodeCancelOrderV2(ix: SerumInstruction): CancelOrderV2 {
    return {
        accounts: {
            market: ix.accounts[0].address,
            bids: ix.accounts[1].address,
            asks: ix.accounts[2].address,
            openOrders: ix.accounts[3].address,
            openOrdersOwner: ix.accounts[4].address,
            eventQueue: ix.accounts[5].address,
        },
        data: mask(decodeInstruction(ix.data).cancelOrderV2, CancelOrderV2Instruction),
    };
}

export type CancelOrderByClientIdV2 = {
    data: Infer<typeof CancelOrderByClientIdV2Instruction>;
    accounts: {
        market: Address;
        bids: Address;
        asks: Address;
        openOrders: Address;
        openOrdersOwner: Address;
        eventQueue: Address;
    };
};

export const CancelOrderByClientIdV2Instruction = object({
    clientId: bigint(),
});

export function decodeCancelOrderByClientIdV2(ix: SerumInstruction): CancelOrderByClientIdV2 {
    return {
        accounts: {
            market: ix.accounts[0].address,
            bids: ix.accounts[1].address,
            asks: ix.accounts[2].address,
            openOrders: ix.accounts[3].address,
            openOrdersOwner: ix.accounts[4].address,
            eventQueue: ix.accounts[5].address,
        },
        data: mask(decodeInstruction(ix.data).cancelOrderByClientIdV2, CancelOrderByClientIdV2Instruction),
    };
}

export type CloseOpenOrders = {
    accounts: {
        openOrders: Address;
        openOrdersOwner: Address;
        rentReceiver: Address;
        market: Address;
    };
};

export function decodeCloseOpenOrders(ix: SerumInstruction): CloseOpenOrders {
    return {
        accounts: {
            openOrders: ix.accounts[0].address,
            openOrdersOwner: ix.accounts[1].address,
            rentReceiver: ix.accounts[2].address,
            market: ix.accounts[3].address,
        },
    };
}

export type InitOpenOrders = {
    accounts: {
        openOrders: Address;
        openOrdersOwner: Address;
        market: Address;
        openOrdersMarketAuthority?: Address;
    };
};

export function decodeInitOpenOrders(ix: SerumInstruction): InitOpenOrders {
    return {
        accounts: {
            openOrders: ix.accounts[0].address,
            openOrdersOwner: ix.accounts[1].address,
            market: ix.accounts[2].address,
            openOrdersMarketAuthority: getOptionalKey(ix.accounts, 4),
        },
    };
}

export type Prune = {
    data: Infer<typeof PruneInstruction>;
    accounts: {
        market: Address;
        bids: Address;
        asks: Address;
        pruneAuthority: Address;
        openOrders: Address;
        openOrdersOwner: Address;
        eventQueue: Address;
    };
};

export const PruneInstruction = object({
    limit: number(),
});

export function decodePrune(ix: SerumInstruction): Prune {
    return {
        accounts: {
            market: ix.accounts[0].address,
            bids: ix.accounts[1].address,
            asks: ix.accounts[2].address,
            pruneAuthority: ix.accounts[3].address,
            openOrders: ix.accounts[4].address,
            openOrdersOwner: ix.accounts[5].address,
            eventQueue: ix.accounts[6].address,
        },
        data: mask(decodeInstruction(ix.data).prune, PruneInstruction),
    };
}

export type ConsumeEventsPermissioned = {
    data: Infer<typeof ConsumeEventsPermissionedInstruction>;
    accounts: {
        openOrders: Address[];
        market: Address;
        eventQueue: Address;
        crankAuthority: Address;
    };
};

export const ConsumeEventsPermissionedInstruction = object({
    limit: number(),
});

export function decodeConsumeEventsPermissioned(ix: SerumInstruction): ConsumeEventsPermissioned {
    return {
        accounts: {
            openOrders: ix.accounts.slice(0, -3).map(account => account.address),
            market: ix.accounts[ix.accounts.length - 3].address,
            eventQueue: ix.accounts[ix.accounts.length - 2].address,
            crankAuthority: ix.accounts[ix.accounts.length - 1].address,
        },
        data: mask(decodeInstruction(ix.data).consumeEventsPermissioned, ConsumeEventsPermissionedInstruction),
    };
}

export function parseSerumInstructionKey(instruction: InstructionWithData<ReadonlyUint8Array>): string {
    const decoded = decodeInstruction(instruction.data);
    const keys = Object.keys(decoded);

    if (keys.length < 1) {
        throw new Error('Serum instruction key not decoded');
    }

    return keys[0];
}

// Codes 7/8/9/13 (disableMarket, sweepFees, newOrderV2, sendTake) have no vendored layout,
// so parseSerumInstructionKey throws for them and no variant below represents them.
// They are identified by name only (see resolveSerumInstructionKey).
export type DecodedSerumInstruction =
    | { type: 'cancelOrder'; info: CancelOrder }
    | { type: 'cancelOrderByClientId'; info: CancelOrderByClientId }
    | { type: 'cancelOrderByClientIdV2'; info: CancelOrderByClientIdV2 }
    | { type: 'cancelOrderV2'; info: CancelOrderV2 }
    | { type: 'closeOpenOrders'; info: CloseOpenOrders }
    | { type: 'consumeEvents'; info: ConsumeEvents }
    | { type: 'consumeEventsPermissioned'; info: ConsumeEventsPermissioned }
    | { type: 'initializeMarket'; info: InitializeMarket }
    | { type: 'initOpenOrders'; info: InitOpenOrders }
    | { type: 'matchOrders'; info: MatchOrders }
    | { type: 'newOrder'; info: NewOrder }
    | { type: 'newOrderV3'; info: NewOrderV3 }
    | { type: 'prune'; info: Prune }
    | { type: 'settleFunds'; info: SettleFunds };

export type SerumInstructionKey = DecodedSerumInstruction['type'];

// Record over SerumInstructionKey so adding a union variant without a decoder entry fails to compile.
const DECODERS: Record<SerumInstructionKey, (instruction: SerumInstruction) => DecodedSerumInstruction> = {
    cancelOrder: instruction => ({ info: decodeCancelOrder(instruction), type: 'cancelOrder' }),
    cancelOrderByClientId: instruction => ({
        info: decodeCancelOrderByClientId(instruction),
        type: 'cancelOrderByClientId',
    }),
    cancelOrderByClientIdV2: instruction => ({
        info: decodeCancelOrderByClientIdV2(instruction),
        type: 'cancelOrderByClientIdV2',
    }),
    cancelOrderV2: instruction => ({ info: decodeCancelOrderV2(instruction), type: 'cancelOrderV2' }),
    closeOpenOrders: instruction => ({ info: decodeCloseOpenOrders(instruction), type: 'closeOpenOrders' }),
    consumeEvents: instruction => ({ info: decodeConsumeEvents(instruction), type: 'consumeEvents' }),
    consumeEventsPermissioned: instruction => ({
        info: decodeConsumeEventsPermissioned(instruction),
        type: 'consumeEventsPermissioned',
    }),
    initializeMarket: instruction => ({ info: decodeInitializeMarket(instruction), type: 'initializeMarket' }),
    initOpenOrders: instruction => ({ info: decodeInitOpenOrders(instruction), type: 'initOpenOrders' }),
    matchOrders: instruction => ({ info: decodeMatchOrders(instruction), type: 'matchOrders' }),
    newOrder: instruction => ({ info: decodeNewOrder(instruction), type: 'newOrder' }),
    newOrderV3: instruction => ({ info: decodeNewOrderV3(instruction), type: 'newOrderV3' }),
    prune: instruction => ({ info: decodePrune(instruction), type: 'prune' }),
    settleFunds: instruction => ({ info: decodeSettleFunds(instruction), type: 'settleFunds' }),
};

const isDecodableKey = (key: string): key is SerumInstructionKey => key in DECODERS;

// Single decode entry point so representation code never dispatches on instruction internals itself.
export function decodeSerumInstruction(instruction: SerumInstruction): DecodedSerumInstruction {
    const key = parseSerumInstructionKey(instruction);
    if (!isDecodableKey(key)) {
        throw new Error(`Unsupported Serum instruction key: ${key}`);
    }
    return DECODERS[key](instruction);
}
