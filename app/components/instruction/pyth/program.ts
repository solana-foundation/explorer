import {
    addDecoderSizePrefix,
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
} from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

/**
 * An enumeration of valid PythInstructionTypes
 */
export type PythInstructionType =
    | 'InitMapping'
    | 'AddMapping'
    | 'AddProduct'
    | 'UpdateProduct'
    | 'AddPrice'
    | 'AddPublisher'
    | 'DeletePublisher'
    | 'UpdatePrice'
    | 'AggregatePrice'
    | 'InitPrice'
    | 'InitTest'
    | 'UpdateTest'
    | 'SetMinPublishers'
    | 'UpdatePriceNoFailOnError';

const headerDecoder = () =>
    getStructDecoder([
        ['version', getU32Decoder()],
        ['type', getU32Decoder()],
    ] as const);

/** A uint8 length-prefixed UTF-8 string. */
const lpStringDecoder = () => addDecoderSizePrefix(getUtf8Decoder(), getU8Decoder());

/** A list of key/value pairs filling all the space remaining in the instruction data. */
const attributesDecoder = () =>
    getArrayDecoder(
        getStructDecoder([
            ['key', lpStringDecoder()],
            ['value', lpStringDecoder()],
        ] as const),
        { size: 'remainder' },
    );

function decodeData(type: { index: number; decoder: Decoder<any> }, buffer: Uint8Array): any {
    let data;
    try {
        data = type.decoder.decode(buffer);
    } catch (err) {
        throw new Error(`invalid instruction; ${err}`);
    }

    if (data.header.type !== type.index) {
        throw new Error(`invalid instruction; instruction index mismatch ${data.header.type} != ${type.index}`);
    }

    return data;
}

/**
 * An enumeration of valid Pyth instruction decoders
 * @internal
 */
export const PYTH_INSTRUCTION_DECODERS: {
    [type in PythInstructionType]: { index: number; decoder: Decoder<any> };
} = Object.freeze({
    AddMapping: {
        decoder: getStructDecoder([['header', headerDecoder()]]),
        index: 1,
    },
    AddPrice: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['exponent', getI32Decoder()],
            ['priceType', getU32Decoder()],
        ]),
        index: 4,
    },
    AddProduct: {
        decoder: getStructDecoder([['header', headerDecoder()]]),
        index: 2,
    },
    AddPublisher: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['publisherPubkey', getAddressDecoder()],
        ]),
        index: 5,
    },
    AggregatePrice: {
        decoder: getStructDecoder([['header', headerDecoder()]]),
        index: 8,
    },
    DeletePublisher: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['publisherPubkey', getAddressDecoder()],
        ]),
        index: 6,
    },
    InitMapping: {
        decoder: getStructDecoder([['header', headerDecoder()]]),
        index: 0,
    },
    InitPrice: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['exponent', getI32Decoder()],
            ['priceType', getU32Decoder()],
        ]),
        index: 9,
    },
    InitTest: {
        decoder: getStructDecoder([['header', headerDecoder()]]),
        index: 10,
    },
    SetMinPublishers: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['minPublishers', getU8Decoder()],
            ['unused1', fixDecoderSize(getBytesDecoder(), 3)],
        ]),
        index: 12,
    },
    UpdatePrice: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['status', getU32Decoder()],
            ['unused1', getU32Decoder()],
            ['price', getI64Decoder()],
            ['conf', getU64Decoder()],
            ['publishSlot', getU64Decoder()],
        ]),
        index: 7,
    },
    UpdatePriceNoFailOnError: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['status', getU32Decoder()],
            ['unused1', getU32Decoder()],
            ['price', getI64Decoder()],
            ['conf', getU64Decoder()],
            ['publishSlot', getU64Decoder()],
        ]),
        index: 13,
    },
    UpdateProduct: {
        decoder: getStructDecoder([
            ['header', headerDecoder()],
            ['attributes', attributesDecoder()],
        ]),
        index: 3,
    },
    UpdateTest: {
        decoder: getStructDecoder([['header', headerDecoder()]]),
        index: 11,
    },
});

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
    fundingPubkey: PublicKey;
    mappingPubkey: PublicKey;
};

export type AddMappingParams = {
    fundingPubkey: PublicKey;
    mappingPubkey: PublicKey;
    nextMappingPubkey: PublicKey;
};

export type AddProductParams = {
    fundingPubkey: PublicKey;
    mappingPubkey: PublicKey;
    productPubkey: PublicKey;
};

export type UpdateProductParams = {
    fundingPubkey: PublicKey;
    productPubkey: PublicKey;
    attributes: Map<string, string>;
};

export type AddPriceParams = {
    fundingPubkey: PublicKey;
    productPubkey: PublicKey;
    pricePubkey: PublicKey;
    exponent: number;
    priceType: PriceType;
};

export type BasePublisherOperationParams = {
    signerPubkey: PublicKey;
    pricePubkey: PublicKey;
    publisherPubkey: PublicKey;
};

export type UpdatePriceParams = {
    publisherPubkey: PublicKey;
    pricePubkey: PublicKey;
    status: TradingStatus;
    price: number;
    conf: number;
    publishSlot: number;
};

export type AggregatePriceParams = {
    fundingPubkey: PublicKey;
    pricePubkey: PublicKey;
};

export type InitPriceParams = {
    fundingPubkey: PublicKey;
    pricePubkey: PublicKey;
    exponent: number;
    priceType: PriceType;
};

export type SetMinPublishersParams = {
    fundingPubkey: PublicKey;
    pricePubkey: PublicKey;
    minPublishers: number;
};

/**
 * Pyth Instruction class
 */
export class PythInstruction {
    /**
     * Decode a Pyth instruction and retrieve the instruction type.
     */
    static decodeInstructionType(instruction: TransactionInstruction): PythInstructionType {
        const header = headerDecoder().decode(instruction.data);
        if (header.version !== 2) {
            throw new Error(`Unsupported Pyth version: ${header.version}`);
        }
        const typeIndex = header.type;

        let type: PythInstructionType | undefined;
        for (const [ixType, { index }] of Object.entries(PYTH_INSTRUCTION_DECODERS)) {
            if (index === typeIndex) {
                type = ixType as PythInstructionType;
                break;
            }
        }

        if (!type) {
            throw new Error('Instruction type incorrect; not a PythInstruction');
        }

        return type;
    }

    /**
     * Decode an "init mapping" instruction and retrieve the instruction params.
     */
    static decodeInitMapping(instruction: TransactionInstruction): InitMappingParams {
        decodeData(PYTH_INSTRUCTION_DECODERS.InitMapping, instruction.data);
        return {
            fundingPubkey: instruction.keys[0].pubkey,
            mappingPubkey: instruction.keys[1].pubkey,
        };
    }

    /**
     * Decode an "add mapping" instruction and retrieve the instruction params.
     */
    static decodeAddMapping(instruction: TransactionInstruction): AddMappingParams {
        decodeData(PYTH_INSTRUCTION_DECODERS.AddMapping, instruction.data);
        return {
            fundingPubkey: instruction.keys[0].pubkey,
            mappingPubkey: instruction.keys[1].pubkey,
            nextMappingPubkey: instruction.keys[2].pubkey,
        };
    }

    /**
     * Decode an "add product" instruction and retrieve the instruction params.
     */
    static decodeAddProduct(instruction: TransactionInstruction): AddProductParams {
        decodeData(PYTH_INSTRUCTION_DECODERS.AddProduct, instruction.data);
        return {
            fundingPubkey: instruction.keys[0].pubkey,
            mappingPubkey: instruction.keys[1].pubkey,
            productPubkey: instruction.keys[2].pubkey,
        };
    }

    /**
     * Decode an "add product" instruction and retrieve the instruction params.
     */
    static decodeUpdateProduct(instruction: TransactionInstruction): UpdateProductParams {
        const { attributes } = decodeData(PYTH_INSTRUCTION_DECODERS.UpdateProduct, instruction.data);
        return {
            attributes: new Map(attributes.map((kv: { key: string; value: string }) => [kv.key, kv.value])),
            fundingPubkey: instruction.keys[0].pubkey,
            productPubkey: instruction.keys[1].pubkey,
        };
    }

    /**
     * Decode an "add price" instruction and retrieve the instruction params.
     */
    static decodeAddPrice(instruction: TransactionInstruction): AddPriceParams {
        const { exponent, priceType } = decodeData(PYTH_INSTRUCTION_DECODERS.AddPrice, instruction.data);
        return {
            exponent,
            fundingPubkey: instruction.keys[0].pubkey,
            pricePubkey: instruction.keys[2].pubkey,
            priceType,
            productPubkey: instruction.keys[1].pubkey,
        };
    }

    /**
     * Decode an "add publisher" instruction and retrieve the instruction params.
     */
    static decodeAddPublisher(instruction: TransactionInstruction): BasePublisherOperationParams {
        const { publisherPubkey } = decodeData(PYTH_INSTRUCTION_DECODERS.AddPublisher, instruction.data);

        return {
            pricePubkey: instruction.keys[1].pubkey,
            publisherPubkey: new PublicKey(publisherPubkey),
            signerPubkey: instruction.keys[0].pubkey,
        };
    }

    /**
     * Decode an "delete publisher" instruction and retrieve the instruction params.
     */
    static decodeDeletePublisher(instruction: TransactionInstruction): BasePublisherOperationParams {
        const { publisherPubkey } = decodeData(PYTH_INSTRUCTION_DECODERS.DeletePublisher, instruction.data);

        return {
            pricePubkey: instruction.keys[1].pubkey,
            publisherPubkey: new PublicKey(publisherPubkey),
            signerPubkey: instruction.keys[0].pubkey,
        };
    }

    /**
     * Decode an "update price" instruction and retrieve the instruction params.
     */
    static decodeUpdatePrice(instruction: TransactionInstruction): UpdatePriceParams {
        const { status, price, conf, publishSlot } = decodeData(
            PYTH_INSTRUCTION_DECODERS.UpdatePrice,
            instruction.data,
        );

        return {
            conf: Number(conf),
            price: Number(price),
            pricePubkey: instruction.keys[1].pubkey,
            publishSlot: Number(publishSlot),
            publisherPubkey: instruction.keys[0].pubkey,
            status,
        };
    }

    /**
     * Decode an "update price no fail error" instruction and retrieve the instruction params.
     */
    static decodeUpdatePriceNoFailOnError(instruction: TransactionInstruction): UpdatePriceParams {
        const { status, price, conf, publishSlot } = decodeData(
            PYTH_INSTRUCTION_DECODERS.UpdatePriceNoFailOnError,
            instruction.data,
        );

        return {
            conf: Number(conf),
            price: Number(price),
            pricePubkey: instruction.keys[1].pubkey,
            publishSlot: Number(publishSlot),
            publisherPubkey: instruction.keys[0].pubkey,
            status,
        };
    }

    /**
     * Decode an "aggregate price" instruction and retrieve the instruction params.
     */
    static decodeAggregatePrice(instruction: TransactionInstruction): AggregatePriceParams {
        decodeData(PYTH_INSTRUCTION_DECODERS.AggregatePrice, instruction.data);

        return {
            fundingPubkey: instruction.keys[0].pubkey,
            pricePubkey: instruction.keys[1].pubkey,
        };
    }

    /**
     * Decode an "init price" instruction and retrieve the instruction params.
     */
    static decodeInitPrice(instruction: TransactionInstruction): InitPriceParams {
        const { exponent, priceType } = decodeData(PYTH_INSTRUCTION_DECODERS.InitPrice, instruction.data);
        return {
            exponent,
            fundingPubkey: instruction.keys[0].pubkey,
            pricePubkey: instruction.keys[1].pubkey,
            priceType,
        };
    }

    /**
     * Decode an "set min publishers" instruction and retrieve the instruction params.
     */
    static decodeSetMinPublishers(instruction: TransactionInstruction): SetMinPublishersParams {
        const { minPublishers } = decodeData(PYTH_INSTRUCTION_DECODERS.SetMinPublishers, instruction.data);
        return {
            fundingPubkey: instruction.keys[0].pubkey,
            minPublishers,
            pricePubkey: instruction.keys[1].pubkey,
        };
    }
}
