import {
    type Decoder,
    getAddressDecoder,
    getStructDecoder,
    getU8Decoder,
    getU16Decoder,
    getU32Decoder,
    getU64Decoder,
    getU128Decoder,
    type ReadonlyUint8Array,
    transformDecoder,
} from '@solana/kit';

// Vendored from @project-serum/serum 0.13.61 `INSTRUCTION_LAYOUT`. Data is a version byte (never checked),
// a u32 LE instruction code, then the variant's fields.
const VERSION_SPAN = 1;
const CODE_SPAN = 4;

function getLiteralDecoder<T extends string>(property: string, values: readonly T[]): Decoder<T> {
    return transformDecoder(getU32Decoder(), value => {
        const literal = values[value];
        if (literal === undefined) throw new Error(`Invalid ${property}`);
        return literal;
    });
}

const side = getLiteralDecoder('side', ['buy', 'sell']);
const orderType = getLiteralDecoder('orderType', ['limit', 'ioc', 'postOnly']);
const selfTradeBehavior = getLiteralDecoder('selfTradeBehavior', [
    'decrementTake',
    'cancelProvide',
    'abortTransaction',
]);
const empty = getStructDecoder([]);
const limitOnly = getStructDecoder([['limit', getU16Decoder()]]);
const clientIdOnly = getStructDecoder([['clientId', getU64Decoder()]]);

// A Map rather than an object literal so the table reads in instruction-code order; codes 7/8/9/13 have no layout.
const INSTRUCTION_LAYOUTS = new Map<number, readonly [string, Decoder<object>]>([
    [
        0,
        [
            'initializeMarket',
            getStructDecoder([
                ['baseLotSize', getU64Decoder()],
                ['quoteLotSize', getU64Decoder()],
                ['feeRateBps', getU16Decoder()],
                ['vaultSignerNonce', getU64Decoder()],
                ['quoteDustThreshold', getU64Decoder()],
            ]),
        ],
    ],
    [
        1,
        [
            'newOrder',
            getStructDecoder([
                ['side', side],
                ['limitPrice', getU64Decoder()],
                ['maxQuantity', getU64Decoder()],
                ['orderType', orderType],
                ['clientId', getU64Decoder()],
            ]),
        ],
    ],
    [2, ['matchOrders', limitOnly]],
    [3, ['consumeEvents', limitOnly]],
    [
        4,
        [
            'cancelOrder',
            getStructDecoder([
                ['side', side],
                ['orderId', getU128Decoder()],
                ['openOrders', getAddressDecoder()],
                ['openOrdersSlot', getU8Decoder()],
            ]),
        ],
    ],
    [5, ['settleFunds', empty]],
    [6, ['cancelOrderByClientId', clientIdOnly]],
    [
        10,
        [
            'newOrderV3',
            getStructDecoder([
                ['side', side],
                ['limitPrice', getU64Decoder()],
                ['maxBaseQuantity', getU64Decoder()],
                ['maxQuoteQuantity', getU64Decoder()],
                ['selfTradeBehavior', selfTradeBehavior],
                ['orderType', orderType],
                ['clientId', getU64Decoder()],
                ['limit', getU16Decoder()],
            ]),
        ],
    ],
    [
        11,
        [
            'cancelOrderV2',
            getStructDecoder([
                ['side', side],
                ['orderId', getU128Decoder()],
            ]),
        ],
    ],
    [12, ['cancelOrderByClientIdV2', clientIdOnly]],
    [14, ['closeOpenOrders', empty]],
    [15, ['initOpenOrders', empty]],
    [16, ['prune', limitOnly]],
    [17, ['consumeEventsPermissioned', limitOnly]],
]);

// Mirrors the library's output shape: a single-key object of `{ [instructionName]: fields }`.
export function decodeInstruction(data: ReadonlyUint8Array): Record<string, unknown> {
    const code = getU32Decoder().decode(data, VERSION_SPAN);
    const layout = INSTRUCTION_LAYOUTS.get(code);
    if (layout === undefined) throw new Error(`Unsupported Serum instruction code: ${code}`);
    const [name, decoder] = layout;
    return { [name]: decoder.decode(data, VERSION_SPAN + CODE_SPAN) };
}
