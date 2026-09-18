import { getAddressEncoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import {
    decodeAddMapping,
    decodeAddPrice,
    decodeAddProduct,
    decodeAddPublisher,
    decodeAggregatePrice,
    decodeDeletePublisher,
    decodeInitMapping,
    decodeInitPrice,
    decodePythInstruction,
    decodeSetMinPublishers,
    decodeUpdatePrice,
    decodeUpdatePriceNoFailOnError,
    decodeUpdateProduct,
    parsePythInstructionType,
} from '../decoder';
import { ACCOUNTS, i64, lpString, PUBLISHER, pythInstruction, rawPythInstruction, u32, u64 } from './fixtures';

const PRICE_UPDATE = [u32(1), u32(0), i64(-12345n), u64(678n), u64(170_640_000n)];

/**
 * Which account each decoder reads from which position, and how it reads the payload. The account
 * mapping is positional and invisible in the instruction data, so nothing but this pins it.
 */
const CASES = [
    {
        decoded: () => decodeInitMapping(pythInstruction('InitMapping')),
        expected: { fundingPubkey: ACCOUNTS.first, mappingPubkey: ACCOUNTS.second },
        name: 'InitMapping',
    },
    {
        decoded: () => decodeAddMapping(pythInstruction('AddMapping')),
        expected: {
            fundingPubkey: ACCOUNTS.first,
            mappingPubkey: ACCOUNTS.second,
            nextMappingPubkey: ACCOUNTS.third,
        },
        name: 'AddMapping',
    },
    {
        decoded: () => decodeAddProduct(pythInstruction('AddProduct')),
        expected: {
            fundingPubkey: ACCOUNTS.first,
            mappingPubkey: ACCOUNTS.second,
            productPubkey: ACCOUNTS.third,
        },
        name: 'AddProduct',
    },
    {
        decoded: () => decodeAddPrice(pythInstruction('AddPrice', u32(0xffff_fff7), u32(1))),
        expected: {
            exponent: -9,
            fundingPubkey: ACCOUNTS.first,
            pricePubkey: ACCOUNTS.third,
            priceType: 1,
            productPubkey: ACCOUNTS.second,
        },
        name: 'AddPrice',
    },
    {
        decoded: () => decodeAddPublisher(pythInstruction('AddPublisher', [...getAddressEncoder().encode(PUBLISHER)])),
        expected: {
            pricePubkey: ACCOUNTS.second,
            publisherPubkey: PUBLISHER,
            signerPubkey: ACCOUNTS.first,
        },
        name: 'AddPublisher',
    },
    {
        decoded: () =>
            decodeDeletePublisher(pythInstruction('DeletePublisher', [...getAddressEncoder().encode(PUBLISHER)])),
        expected: {
            pricePubkey: ACCOUNTS.second,
            publisherPubkey: PUBLISHER,
            signerPubkey: ACCOUNTS.first,
        },
        name: 'DeletePublisher',
    },
    {
        decoded: () => decodeUpdatePrice(pythInstruction('UpdatePrice', ...PRICE_UPDATE)),
        expected: {
            conf: 678,
            price: -12345,
            pricePubkey: ACCOUNTS.second,
            publishSlot: 170_640_000,
            publisherPubkey: ACCOUNTS.first,
            status: 1,
        },
        name: 'UpdatePrice',
    },
    {
        decoded: () => decodeUpdatePriceNoFailOnError(pythInstruction('UpdatePriceNoFailOnError', ...PRICE_UPDATE)),
        expected: {
            conf: 678,
            price: -12345,
            pricePubkey: ACCOUNTS.second,
            publishSlot: 170_640_000,
            publisherPubkey: ACCOUNTS.first,
            status: 1,
        },
        name: 'UpdatePriceNoFailOnError',
    },
    {
        decoded: () => decodeAggregatePrice(pythInstruction('AggregatePrice')),
        expected: { fundingPubkey: ACCOUNTS.first, pricePubkey: ACCOUNTS.second },
        name: 'AggregatePrice',
    },
    {
        decoded: () => decodeInitPrice(pythInstruction('InitPrice', u32(0xffff_fff7), u32(1))),
        expected: {
            exponent: -9,
            fundingPubkey: ACCOUNTS.first,
            pricePubkey: ACCOUNTS.second,
            priceType: 1,
        },
        name: 'InitPrice',
    },
    {
        decoded: () => decodeSetMinPublishers(pythInstruction('SetMinPublishers', [3], [0, 0, 0])),
        expected: { fundingPubkey: ACCOUNTS.first, minPublishers: 3, pricePubkey: ACCOUNTS.second },
        name: 'SetMinPublishers',
    },
];

describe('decoder', () => {
    it.each(CASES)('should decode $name', ({ decoded, expected }) => {
        expect(decoded()).toEqual(expected);
    });

    it('should decode the trailing attribute list of an update product instruction', () => {
        const ix = pythInstruction(
            'UpdateProduct',
            lpString('symbol'),
            lpString('BTC/USD'),
            lpString('asset_type'),
            lpString('Crypto'),
        );
        const { attributes, fundingPubkey, productPubkey } = decodeUpdateProduct(ix);

        expect(Object.fromEntries(attributes)).toEqual({ asset_type: 'Crypto', symbol: 'BTC/USD' });
        expect(fundingPubkey).toBe(ACCOUNTS.first);
        expect(productPubkey).toBe(ACCOUNTS.second);
    });

    it('should read an empty attribute list as no attributes', () => {
        expect(decodeUpdateProduct(pythInstruction('UpdateProduct')).attributes.size).toBe(0);
    });
});

describe('decodePythInstruction', () => {
    it('should decode the two payload-free test instructions', () => {
        expect(decodePythInstruction(pythInstruction('InitTest'))).toEqual({ info: {}, type: 'InitTest' });
        expect(decodePythInstruction(pythInstruction('UpdateTest'))).toEqual({ info: {}, type: 'UpdateTest' });
    });

    it('should decode a payload instruction to its typed params', () => {
        expect(decodePythInstruction(pythInstruction('UpdatePrice', ...PRICE_UPDATE))).toEqual({
            info: {
                conf: 678,
                price: -12345,
                pricePubkey: ACCOUNTS.second,
                publishSlot: 170_640_000,
                publisherPubkey: ACCOUNTS.first,
                status: 1,
            },
            type: 'UpdatePrice',
        });
    });

    it('should reject a payload too short for its instruction', () => {
        expect(() => decodePythInstruction(pythInstruction('AddPrice'))).toThrow('invalid instruction');
    });

    it('should reject an instruction missing a positional account', () => {
        const ix = { ...pythInstruction('AddMapping'), accounts: [] };
        expect(() => decodePythInstruction(ix)).toThrow('missing account at index 0');
    });
});

describe('parsePythInstructionType', () => {
    it('should resolve the instruction type from the header', () => {
        expect(parsePythInstructionType(pythInstruction('InitMapping'))).toBe('InitMapping');
        expect(parsePythInstructionType(pythInstruction('UpdatePrice', ...PRICE_UPDATE))).toBe('UpdatePrice');
    });

    it('should reject an unsupported Pyth version', () => {
        expect(() => parsePythInstructionType(rawPythInstruction([...u32(1), ...u32(0)]))).toThrow(
            'Unsupported Pyth version: 1',
        );
    });

    it('should reject an index no instruction uses', () => {
        expect(() => parsePythInstructionType(rawPythInstruction([...u32(2), ...u32(14)]))).toThrow(
            'Unknown Pyth instruction index: 14',
        );
    });

    it('should reject data whose instruction index does not match the decoder', () => {
        expect(() => decodeInitMapping(pythInstruction('AddMapping'))).toThrow('instruction index mismatch 1 != 0');
    });
});
