import {
    type AccountMeta,
    addDecoderSizePrefix,
    type Address,
    type Decoder,
    fixDecoderSize,
    getAddressDecoder,
    getArrayDecoder,
    getBytesDecoder,
    getI32Decoder,
    getI64Decoder,
    getStructDecoder,
    getU8Decoder,
    getU32Decoder,
    getU64Decoder,
    getUtf8Decoder,
    type Instruction,
    type InstructionWithAccounts,
    type InstructionWithData,
    type ReadonlyUint8Array,
} from '@solana/kit';

import {
    PYTH_INSTRUCTION_VERSION,
    PYTH_INSTRUCTIONS,
    type PythInstructionType,
    pythInstructionTypeAt,
} from './instructions';

type PythHeader = { version: number; type: number };

/** The kit instruction shape every decoder reads: the payload bytes plus the ordered account list. */
export type PythInstruction = Instruction<string> &
    InstructionWithAccounts<readonly AccountMeta[]> &
    InstructionWithData<ReadonlyUint8Array>;

const headerDecoder = () =>
    getStructDecoder([
        ['version', getU32Decoder()],
        ['type', getU32Decoder()],
    ] as const);

const lpStringDecoder = () => addDecoderSizePrefix(getUtf8Decoder(), getU8Decoder());

const attributesDecoder = () =>
    getArrayDecoder(
        getStructDecoder([
            ['key', lpStringDecoder()],
            ['value', lpStringDecoder()],
        ] as const),
        { size: 'remainder' },
    );

const headerOnlyDecoder = getStructDecoder([['header', headerDecoder()]] as const);

const priceUpdateDecoder = getStructDecoder([
    ['header', headerDecoder()],
    ['status', getU32Decoder()],
    // Padding: the C struct aligns the i64 price to 8 bytes.
    ['unused1', getU32Decoder()],
    ['price', getI64Decoder()],
    ['conf', getU64Decoder()],
    ['publishSlot', getU64Decoder()],
] as const);

const priceAccountDecoder = getStructDecoder([
    ['header', headerDecoder()],
    ['exponent', getI32Decoder()],
    ['priceType', getU32Decoder()],
] as const);

const publisherDecoder = getStructDecoder([
    ['header', headerDecoder()],
    ['publisherPubkey', getAddressDecoder()],
] as const);

/** `satisfies` rather than an annotation: it pins exhaustiveness without widening each payload type. */
const PAYLOAD_DECODERS = {
    AddMapping: headerOnlyDecoder,
    AddPrice: priceAccountDecoder,
    AddProduct: headerOnlyDecoder,
    AddPublisher: publisherDecoder,
    AggregatePrice: headerOnlyDecoder,
    DeletePublisher: publisherDecoder,
    InitMapping: headerOnlyDecoder,
    InitPrice: priceAccountDecoder,
    InitTest: headerOnlyDecoder,
    SetMinPublishers: getStructDecoder([
        ['header', headerDecoder()],
        ['minPublishers', getU8Decoder()],
        // Padding: minPublishers is a u8 sitting in a u32 slot.
        ['unused1', fixDecoderSize(getBytesDecoder(), 3)],
    ] as const),
    UpdatePrice: priceUpdateDecoder,
    UpdatePriceNoFailOnError: priceUpdateDecoder,
    UpdateProduct: getStructDecoder([
        ['header', headerDecoder()],
        ['attributes', attributesDecoder()],
    ] as const),
    UpdateTest: headerOnlyDecoder,
} satisfies Record<PythInstructionType, Decoder<{ header: PythHeader }>>;

function decoderFor<T extends PythInstructionType>(type: T) {
    return { decoder: PAYLOAD_DECODERS[type], index: PYTH_INSTRUCTIONS[type].index };
}

function decodeData<T extends { header: PythHeader }>(
    { decoder, index }: { decoder: Decoder<T>; index: number },
    data: ReadonlyUint8Array,
): T {
    let decoded: T;
    try {
        decoded = decoder.decode(data);
    } catch (err) {
        throw new Error(`invalid instruction; ${err}`);
    }

    if (decoded.header.type !== index) {
        throw new Error(`invalid instruction; instruction index mismatch ${decoded.header.type} != ${index}`);
    }

    return decoded;
}

export enum PriceType {
    Unknown = 0,
    Price,
}

export enum TradingStatus {
    Unknown = 0,
    Trading,
    Halted,
    Auction,
}

export type InitMappingParams = {
    fundingPubkey: Address;
    mappingPubkey: Address;
};

export type AddMappingParams = {
    fundingPubkey: Address;
    mappingPubkey: Address;
    nextMappingPubkey: Address;
};

export type AddProductParams = {
    fundingPubkey: Address;
    mappingPubkey: Address;
    productPubkey: Address;
};

export type UpdateProductParams = {
    fundingPubkey: Address;
    productPubkey: Address;
    attributes: Record<string, string>;
};

export type AddPriceParams = {
    fundingPubkey: Address;
    productPubkey: Address;
    pricePubkey: Address;
    exponent: number;
    priceType: PriceType;
};

export type BasePublisherOperationParams = {
    signerPubkey: Address;
    pricePubkey: Address;
    publisherPubkey: Address;
};

export type UpdatePriceParams = {
    publisherPubkey: Address;
    pricePubkey: Address;
    status: TradingStatus;
    price: number;
    conf: number;
    publishSlot: number;
};

export type AggregatePriceParams = {
    fundingPubkey: Address;
    pricePubkey: Address;
};

export type InitPriceParams = {
    fundingPubkey: Address;
    pricePubkey: Address;
    exponent: number;
    priceType: PriceType;
};

export type SetMinPublishersParams = {
    fundingPubkey: Address;
    pricePubkey: Address;
    minPublishers: number;
};

function account(instruction: PythInstruction, position: number): Address {
    const meta = instruction.accounts[position];
    if (!meta) {
        throw new Error(`invalid instruction; missing account at index ${position}`);
    }
    return meta.address;
}

export function parsePythInstructionType(instruction: PythInstruction): PythInstructionType {
    const header = headerDecoder().decode(instruction.data);
    if (header.version !== PYTH_INSTRUCTION_VERSION) {
        throw new Error(`Unsupported Pyth version: ${header.version}`);
    }

    const type = pythInstructionTypeAt(header.type);
    if (!type) {
        throw new Error(`Unknown Pyth instruction index: ${header.type}`);
    }

    return type;
}

export function decodeInitMapping(instruction: PythInstruction): InitMappingParams {
    decodeData(decoderFor('InitMapping'), instruction.data);
    return {
        fundingPubkey: account(instruction, 0),
        mappingPubkey: account(instruction, 1),
    };
}

export function decodeAddMapping(instruction: PythInstruction): AddMappingParams {
    decodeData(decoderFor('AddMapping'), instruction.data);
    return {
        fundingPubkey: account(instruction, 0),
        mappingPubkey: account(instruction, 1),
        nextMappingPubkey: account(instruction, 2),
    };
}

export function decodeAddProduct(instruction: PythInstruction): AddProductParams {
    decodeData(decoderFor('AddProduct'), instruction.data);
    return {
        fundingPubkey: account(instruction, 0),
        mappingPubkey: account(instruction, 1),
        productPubkey: account(instruction, 2),
    };
}

export function decodeUpdateProduct(instruction: PythInstruction): UpdateProductParams {
    const { attributes } = decodeData(decoderFor('UpdateProduct'), instruction.data);
    return {
        attributes: Object.fromEntries(attributes.map(({ key, value }) => [key, value])),
        fundingPubkey: account(instruction, 0),
        productPubkey: account(instruction, 1),
    };
}

export function decodeAddPrice(instruction: PythInstruction): AddPriceParams {
    const { exponent, priceType } = decodeData(decoderFor('AddPrice'), instruction.data);
    return {
        exponent,
        fundingPubkey: account(instruction, 0),
        pricePubkey: account(instruction, 2),
        priceType,
        productPubkey: account(instruction, 1),
    };
}

export function decodeAddPublisher(instruction: PythInstruction): BasePublisherOperationParams {
    const { publisherPubkey } = decodeData(decoderFor('AddPublisher'), instruction.data);
    return {
        pricePubkey: account(instruction, 1),
        publisherPubkey,
        signerPubkey: account(instruction, 0),
    };
}

export function decodeDeletePublisher(instruction: PythInstruction): BasePublisherOperationParams {
    const { publisherPubkey } = decodeData(decoderFor('DeletePublisher'), instruction.data);
    return {
        pricePubkey: account(instruction, 1),
        publisherPubkey,
        signerPubkey: account(instruction, 0),
    };
}

export function decodeUpdatePrice(instruction: PythInstruction): UpdatePriceParams {
    return toUpdatePriceParams(decodeData(decoderFor('UpdatePrice'), instruction.data), instruction);
}

export function decodeUpdatePriceNoFailOnError(instruction: PythInstruction): UpdatePriceParams {
    return toUpdatePriceParams(decodeData(decoderFor('UpdatePriceNoFailOnError'), instruction.data), instruction);
}

function toUpdatePriceParams(
    { conf, price, publishSlot, status }: { conf: bigint; price: bigint; publishSlot: bigint; status: number },
    instruction: PythInstruction,
): UpdatePriceParams {
    return {
        conf: Number(conf),
        price: Number(price),
        pricePubkey: account(instruction, 1),
        publishSlot: Number(publishSlot),
        publisherPubkey: account(instruction, 0),
        status,
    };
}

export function decodeAggregatePrice(instruction: PythInstruction): AggregatePriceParams {
    decodeData(decoderFor('AggregatePrice'), instruction.data);
    return {
        fundingPubkey: account(instruction, 0),
        pricePubkey: account(instruction, 1),
    };
}

export function decodeInitPrice(instruction: PythInstruction): InitPriceParams {
    const { exponent, priceType } = decodeData(decoderFor('InitPrice'), instruction.data);
    return {
        exponent,
        fundingPubkey: account(instruction, 0),
        pricePubkey: account(instruction, 1),
        priceType,
    };
}

export function decodeSetMinPublishers(instruction: PythInstruction): SetMinPublishersParams {
    const { minPublishers } = decodeData(decoderFor('SetMinPublishers'), instruction.data);
    return {
        fundingPubkey: account(instruction, 0),
        minPublishers,
        pricePubkey: account(instruction, 1),
    };
}

/**
 * Canonical shape of a decoded Pyth oracle instruction: the discriminated union the
 * dispatcher hands to the card, so `switch (parsed.type)` narrows `info` per instruction.
 */
export type PythParsed =
    | { type: 'AddMapping'; info: AddMappingParams }
    | { type: 'AddPrice'; info: AddPriceParams }
    | { type: 'AddProduct'; info: AddProductParams }
    | { type: 'AddPublisher'; info: BasePublisherOperationParams }
    | { type: 'AggregatePrice'; info: AggregatePriceParams }
    | { type: 'DeletePublisher'; info: BasePublisherOperationParams }
    | { type: 'InitMapping'; info: InitMappingParams }
    | { type: 'InitPrice'; info: InitPriceParams }
    | { type: 'InitTest'; info: Record<string, never> }
    | { type: 'SetMinPublishers'; info: SetMinPublishersParams }
    | { type: 'UpdatePrice'; info: UpdatePriceParams }
    | { type: 'UpdatePriceNoFailOnError'; info: UpdatePriceParams }
    | { type: 'UpdateProduct'; info: UpdateProductParams }
    | { type: 'UpdateTest'; info: Record<string, never> };

/** Decode any Pyth oracle instruction. Throws on an unsupported version, unknown index, or malformed payload. */
export function decodePythInstruction(instruction: PythInstruction): PythParsed {
    const type = parsePythInstructionType(instruction);
    switch (type) {
        case 'InitMapping':
            return { info: decodeInitMapping(instruction), type };
        case 'AddMapping':
            return { info: decodeAddMapping(instruction), type };
        case 'AddProduct':
            return { info: decodeAddProduct(instruction), type };
        case 'UpdateProduct':
            return { info: decodeUpdateProduct(instruction), type };
        case 'AddPrice':
            return { info: decodeAddPrice(instruction), type };
        case 'AddPublisher':
            return { info: decodeAddPublisher(instruction), type };
        case 'DeletePublisher':
            return { info: decodeDeletePublisher(instruction), type };
        case 'UpdatePrice':
            return { info: decodeUpdatePrice(instruction), type };
        case 'UpdatePriceNoFailOnError':
            return { info: decodeUpdatePriceNoFailOnError(instruction), type };
        case 'AggregatePrice':
            return { info: decodeAggregatePrice(instruction), type };
        case 'InitPrice':
            return { info: decodeInitPrice(instruction), type };
        case 'SetMinPublishers':
            return { info: decodeSetMinPublishers(instruction), type };
        // The oracle's two test instructions carry no payload beyond the header.
        case 'InitTest':
        case 'UpdateTest':
            decodeData(decoderFor(type), instruction.data);
            return { info: {}, type };
        default: {
            const _exhaustive: never = type;
            return _exhaustive;
        }
    }
}
