import {
    getCreateMasterEditionV3InstructionDataSerializer,
    getCreateMetadataAccountV3InstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
} from '@metaplex-foundation/mpl-token-metadata';
import { none, publicKey as umiPublicKey, some } from '@metaplex-foundation/umi';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, test } from 'vitest';

import {
    identifyInstructionType,
    parseMetaplexTokenMetadataInstruction,
    TOKEN_METADATA_PROGRAM_ADDRESS,
} from '../metaplex-token-metadata.parser';

const PROGRAM_ID = new PublicKey(TOKEN_METADATA_PROGRAM_ADDRESS);

// Generated test public keys (byte-filled for readability)
const KEY_A = new PublicKey(new Uint8Array(32).fill(1));
const KEY_B = new PublicKey(new Uint8Array(32).fill(2));
const KEY_C = new PublicKey(new Uint8Array(32).fill(3));
const KEY_D = new PublicKey(new Uint8Array(32).fill(4));
const KEY_E = PublicKey.default;

// Hoisted serializers — construction allocates nested objects, so share across tests
const createMetadataV3Serializer = getCreateMetadataAccountV3InstructionDataSerializer();
const updateMetadataV2Serializer = getUpdateMetadataAccountV2InstructionDataSerializer();
const createMasterEditionV3Serializer = getCreateMasterEditionV3InstructionDataSerializer();

function makeIx(data: Uint8Array | Buffer, keys: PublicKey[] = []): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId: PROGRAM_ID,
    });
}

function assertParsed<T>(val: T | null | undefined): T {
    expect(val).toBeDefined();
    return val as T;
}

describe('identifyInstructionType', () => {
    test('should return undefined for empty data', () => {
        expect(identifyInstructionType(new Uint8Array())).toBeUndefined();
    });

    test('should return undefined for unknown single-byte discriminator', () => {
        expect(identifyInstructionType(new Uint8Array([0xff]))).toBeUndefined();
        expect(identifyInstructionType(new Uint8Array([0]))).toBeUndefined();
        expect(identifyInstructionType(new Uint8Array([99]))).toBeUndefined();
    });

    test.each([
        [4, 'updatePrimarySaleHappenedViaToken'],
        [7, 'signMetadata'],
        [11, 'mintNewEditionFromMasterEditionViaToken'],
        [15, 'updateMetadataAccountV2'],
        [17, 'createMasterEditionV3'],
        [25, 'setAndVerifyCollection'],
        [26, 'verifyCollection'],
        [27, 'unverifyCollection'],
        [29, 'burnNft'],
        [30, 'verifySizedCollectionItem'],
        [31, 'unverifySizedCollectionItem'],
        [32, 'setAndVerifySizedCollectionItem'],
        [33, 'createMetadataAccountV3'],
        [37, 'burnEditionNft'],
        [41, 'burnV1'],
        [42, 'createV1'],
        [43, 'mintV1'],
        [46, 'lockV1'],
        [47, 'unlockV1'],
        [49, 'transferV1'],
        [50, 'updateV1'],
        [51, 'useV1'],
    ])('should map byte %i to %s', (byte, expected) => {
        expect(identifyInstructionType(new Uint8Array([byte]))).toBe(expected);
    });

    describe('delegate sub-discriminators (byte 0 = 44)', () => {
        test('should return undefined when only one byte', () => {
            expect(identifyInstructionType(new Uint8Array([44]))).toBeUndefined();
        });

        test.each([
            [0, 'delegateCollectionV1'],
            [1, 'delegateSaleV1'],
            [2, 'delegateTransferV1'],
            [3, 'delegateDataV1'],
            [4, 'delegateUtilityV1'],
            [5, 'delegateStakingV1'],
            [6, 'delegateStandardV1'],
            [7, 'delegateLockedTransferV1'],
        ])('should map sub-byte %i to %s', (sub, expected) => {
            expect(identifyInstructionType(new Uint8Array([44, sub]))).toBe(expected);
        });

        test('should return undefined for unknown delegate sub-discriminator', () => {
            expect(identifyInstructionType(new Uint8Array([44, 99]))).toBeUndefined();
        });
    });

    describe('revoke sub-discriminators (byte 0 = 45)', () => {
        test('should return undefined when only one byte', () => {
            expect(identifyInstructionType(new Uint8Array([45]))).toBeUndefined();
        });

        test.each([
            [0, 'revokeCollectionV1'],
            [1, 'revokeSaleV1'],
            [2, 'revokeTransferV1'],
            [3, 'revokeDataV1'],
            [4, 'revokeUtilityV1'],
            [5, 'revokeStakingV1'],
            [6, 'revokeStandardV1'],
            [7, 'revokeLockedTransferV1'],
        ])('should map sub-byte %i to %s', (sub, expected) => {
            expect(identifyInstructionType(new Uint8Array([45, sub]))).toBe(expected);
        });
    });

    describe('print sub-discriminators (byte 0 = 55)', () => {
        test('should return undefined when only one byte', () => {
            expect(identifyInstructionType(new Uint8Array([55]))).toBeUndefined();
        });

        test.each([
            [0, 'printV1'],
            [1, 'printV2'],
        ])('should map sub-byte %i to %s', (sub, expected) => {
            expect(identifyInstructionType(new Uint8Array([55, sub]))).toBe(expected);
        });

        test('should return undefined for unknown print sub-discriminator', () => {
            expect(identifyInstructionType(new Uint8Array([55, 99]))).toBeUndefined();
        });
    });
});

describe('parseMetaplexTokenMetadataInstruction', () => {
    test('should return undefined for empty instruction data', () => {
        expect(parseMetaplexTokenMetadataInstruction(makeIx(new Uint8Array()))).toBeUndefined();
    });

    test('should return undefined for unknown discriminator', () => {
        expect(parseMetaplexTokenMetadataInstruction(makeIx(new Uint8Array([0xff])))).toBeUndefined();
    });

    test('should return type even when data decoding throws (corrupted payload)', () => {
        // signMetadata discriminator (7) but no valid payload
        const result = assertParsed(parseMetaplexTokenMetadataInstruction(makeIx(new Uint8Array([7]), [KEY_A, KEY_B])));
        expect(result.type).toBe('signMetadata');
        // info may be populated from keys or empty — either is acceptable
    });

    test('should return type only for delegate/revoke instructions that have no decoding', () => {
        const result = assertParsed(parseMetaplexTokenMetadataInstruction(makeIx(new Uint8Array([44, 0]))));
        expect(result.type).toBe('delegateCollectionV1');
        expect(result.info).toEqual({});
    });

    describe('createMetadataAccountV3', () => {
        function buildData(name: string, symbol: string, uri: string, basisPoints: number, isMutable: boolean) {
            return Buffer.from(
                createMetadataV3Serializer.serialize({
                    collectionDetails: none(),
                    data: {
                        collection: none(),
                        creators: none(),
                        name,
                        sellerFeeBasisPoints: basisPoints,
                        symbol,
                        uri,
                        uses: none(),
                    },
                    isMutable,
                }),
            );
        }

        test('should decode data fields and map account keys', () => {
            // keys: metadata[0], mint[1], mintAuthority[2], payer[3], updateAuthority[4]
            const keys = [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E];
            const ix = makeIx(buildData('My NFT', 'MNFT', 'https://example.com/nft', 500, true), keys);
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(ix));

            expect(result.type).toBe('createMetadataAccountV3');
            expect(result.info.name).toBe('My NFT');
            expect(result.info.symbol).toBe('MNFT');
            expect(result.info.uri).toBe('https://example.com/nft');
            expect(result.info.sellerFeeBasisPoints).toBe(500);
            expect(result.info.isMutable).toBe(true);
            expect((result.info.metadata as PublicKey).equals(KEY_A)).toBe(true);
            expect((result.info.mint as PublicKey).equals(KEY_B)).toBe(true);
            expect((result.info.mintAuthority as PublicKey).equals(KEY_C)).toBe(true);
            expect((result.info.payer as PublicKey).equals(KEY_D)).toBe(true);
            expect((result.info.updateAuthority as PublicKey).equals(KEY_E)).toBe(true);
        });
    });

    describe('updateMetadataAccountV2', () => {
        function buildData(opts: {
            name?: string;
            newUpdateAuthority?: string;
            isMutable?: boolean;
            primarySaleHappened?: boolean;
        }) {
            return Buffer.from(
                updateMetadataV2Serializer.serialize({
                    data:
                        opts.name !== undefined
                            ? some({
                                  collection: none(),
                                  creators: none(),
                                  name: opts.name,
                                  sellerFeeBasisPoints: 0,
                                  symbol: 'SYM',
                                  uri: 'https://example.com',
                                  uses: none(),
                              })
                            : none(),
                    isMutable: opts.isMutable !== undefined ? some(opts.isMutable) : none(),
                    newUpdateAuthority:
                        opts.newUpdateAuthority !== undefined ? some(umiPublicKey(opts.newUpdateAuthority)) : none(),
                    primarySaleHappened:
                        opts.primarySaleHappened !== undefined ? some(opts.primarySaleHappened) : none(),
                }),
            );
        }

        // Pre-computed all-None instruction shared by tests that only check null fields
        const allNoneIx = makeIx(buildData({}), [KEY_A, KEY_B]);

        test('should decode name from Some(data)', () => {
            const ix = makeIx(buildData({ name: 'Updated Name' }), [KEY_A, KEY_B]);
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(ix));

            expect(result.type).toBe('updateMetadataAccountV2');
            expect(result.info.name).toBe('Updated Name');
        });

        test('should return null name/symbol/uri when data is None', () => {
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(allNoneIx));

            expect(result.info.name).toBeNull();
            expect(result.info.symbol).toBeNull();
            expect(result.info.uri).toBeNull();
        });

        test('should decode newUpdateAuthority as a PublicKey when Some', () => {
            const ix = makeIx(buildData({ newUpdateAuthority: KEY_C.toBase58() }), [KEY_A, KEY_B]);
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(ix));

            expect(result.info.newUpdateAuthority).toBeInstanceOf(PublicKey);
            expect((result.info.newUpdateAuthority as PublicKey).equals(KEY_C)).toBe(true);
        });

        test('should return null newUpdateAuthority when None', () => {
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(allNoneIx));

            expect(result.info.newUpdateAuthority).toBeNull();
        });

        test('should decode isMutable and primarySaleHappened', () => {
            const ix = makeIx(buildData({ isMutable: false, primarySaleHappened: true }), [KEY_A, KEY_B]);
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(ix));

            expect(result.info.isMutable).toBe(false);
            expect(result.info.primarySaleHappened).toBe(true);
        });

        test('should return null for isMutable/primarySaleHappened when None', () => {
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(allNoneIx));

            expect(result.info.isMutable).toBeNull();
            expect(result.info.primarySaleHappened).toBeNull();
        });
    });

    describe('createMasterEditionV3', () => {
        function buildData(maxSupply: bigint | null) {
            return Buffer.from(
                createMasterEditionV3Serializer.serialize({
                    maxSupply: maxSupply !== null ? some(maxSupply) : none(),
                }),
            );
        }

        test('should decode maxSupply as a number when Some', () => {
            // keys: edition[0], mint[1], updateAuth[2], mintAuth[3], payer[4], metadata[5]
            const ix = makeIx(buildData(100n), [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_A]);
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(ix));

            expect(result.type).toBe('createMasterEditionV3');
            expect(result.info.maxSupply).toBe(100);
        });

        test('should decode maxSupply as null and map account keys', () => {
            // keys: edition[0], mint[1], updateAuth[2], mintAuth[3], payer[4], metadata[5]
            const keys = [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_A];
            const ix = makeIx(buildData(null), keys);
            const result = assertParsed(parseMetaplexTokenMetadataInstruction(ix));

            expect(result.info.maxSupply).toBeNull();
            expect((result.info.edition as PublicKey).equals(KEY_A)).toBe(true);
            expect((result.info.mint as PublicKey).equals(KEY_B)).toBe(true);
            expect((result.info.updateAuthority as PublicKey).equals(KEY_C)).toBe(true);
            expect((result.info.mintAuthority as PublicKey).equals(KEY_D)).toBe(true);
            expect((result.info.payer as PublicKey).equals(KEY_E)).toBe(true);
            expect((result.info.metadata as PublicKey).equals(KEY_A)).toBe(true);
        });
    });
});
