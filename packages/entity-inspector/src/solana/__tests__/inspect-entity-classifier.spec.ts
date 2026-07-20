import { describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import {
    ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
    BPF_LOADER_2_PROGRAM_ID,
    BPF_LOADER_PROGRAM_ID,
    FEATURE_PROGRAM_ID,
    LOADER_V4_PROGRAM_ID,
    NFTOKEN_ADDRESS,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
} from '../constants.js';
import {
    classifyAccountKindBase,
    decodeBase58,
    decodeIdentifierKind,
    extractTokenSubtype,
    normalizeDasOutcome,
    promoteAccountKindWithDas,
} from '../inspect-entity-classifier.js';

const ACCOUNT_IDENTIFIER = '11111111111111111111111111111111';
const TRANSACTION_IDENTIFIER =
    '4ReKprwf3WdLHRrzp4ctPWNBsQDPL3VZz3zMmoZfcGJMJCHh5Vq937mPdyxhCbw54wNnA6hZ7KfNpQdpt13yY7A9';

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe('inspect-entity classifier', () => {
    it('should decode base58 identifiers and route by deterministic byte length', () => {
        const logger = createLoggerMock();
        const accountBytes = decodeBase58(ACCOUNT_IDENTIFIER);
        const transactionBytes = decodeBase58(TRANSACTION_IDENTIFIER);

        expect(accountBytes?.length).toBe(32);
        expect(transactionBytes?.length).toBe(64);
        expect(decodeIdentifierKind(ACCOUNT_IDENTIFIER)).toBe('account');
        expect(decodeIdentifierKind(TRANSACTION_IDENTIFIER)).toBe('transaction');
        expect(decodeIdentifierKind('not@base58', logger)).toBe('invalid');
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] base58 decode of identifier failed',
            expect.objectContaining({ value: 'not@base58' }),
        );
        expect(decodeBase58('')).toBeNull();
        expect(decodeBase58('111')).toEqual(new Uint8Array([0, 0, 0]));
    });

    it('should mark base58 values of unsupported byte lengths as invalid', () => {
        expect(decodeIdentifierKind('111')).toBe('invalid');
    });

    it('should warn through the console logger by default when base58 decode fails', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(decodeBase58('not@base58')).toBeNull();
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('should extract token subtype deterministically', () => {
        expect(extractTokenSubtype({ type: 'mint' })).toBe('mint');
        expect(extractTokenSubtype({ type: 'account' })).toBe('account');
        expect(extractTokenSubtype({ type: 'multisig' })).toBe('multisig');
        expect(extractTokenSubtype({ type: 'other' })).toBeNull();
        expect(extractTokenSubtype('account')).toBeNull();
    });

    it('should classify loader and stake programs from parsed program', () => {
        expect(
            classifyAccountKindBase({
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                rawDataBytes: null,
            }),
        ).toBe('bpf-upgradeable-loader');

        expect(
            classifyAccountKindBase({
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'stake',
                rawDataBytes: null,
            }),
        ).toBe('stake');
    });

    it('should classify legacy and v4 loader programs by owner', () => {
        expect(
            classifyAccountKindBase({
                owner: BPF_LOADER_PROGRAM_ID,
                parsedData: null,
                parsedProgram: null,
                rawDataBytes: null,
            }),
        ).toBe('bpf-loader');

        expect(
            classifyAccountKindBase({
                owner: BPF_LOADER_2_PROGRAM_ID,
                parsedData: null,
                parsedProgram: null,
                rawDataBytes: null,
            }),
        ).toBe('bpf-loader-2');

        expect(
            classifyAccountKindBase({
                owner: LOADER_V4_PROGRAM_ID,
                parsedData: null,
                parsedProgram: null,
                rawDataBytes: null,
            }),
        ).toBe('loader-v4');
    });

    it('should prioritize nftoken owner check before token parser classification', () => {
        const kind = classifyAccountKindBase({
            owner: NFTOKEN_ADDRESS,
            parsedData: { info: {}, type: 'account' },
            parsedProgram: 'spl-token',
            rawDataBytes: null,
        });

        expect(kind).toBe('nftoken');
    });

    it('should fall through token programs without a recognized subtype', () => {
        expect(
            classifyAccountKindBase({
                owner: 'owner',
                parsedData: {},
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            }),
        ).toBe('unknown');
    });

    it('should support address-lookup-table fallback from raw bytes only under the ALT program owner', () => {
        const kind = classifyAccountKindBase({
            owner: ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
            parsedData: null,
            parsedProgram: null,
            rawDataBytes: new Uint8Array(56),
        });

        const unknownKind = classifyAccountKindBase({
            owner: ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
            parsedData: null,
            parsedProgram: null,
            rawDataBytes: new Uint8Array(57),
        });

        const shortKind = classifyAccountKindBase({
            owner: ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
            parsedData: null,
            parsedProgram: null,
            rawDataBytes: new Uint8Array(10),
        });

        // The layout heuristic alone must not classify foreign-owned accounts as ALTs.
        const foreignOwnerKind = classifyAccountKindBase({
            owner: 'SomeOwner',
            parsedData: null,
            parsedProgram: null,
            rawDataBytes: new Uint8Array(56),
        });

        const noRawBytesKind = classifyAccountKindBase({
            owner: ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
            parsedData: null,
            parsedProgram: null,
            rawDataBytes: null,
        });

        expect(kind).toBe('address-lookup-table');
        expect(unknownKind).toBe('unknown');
        expect(shortKind).toBe('unknown');
        expect(foreignOwnerKind).toBe('unknown');
        expect(noRawBytesKind).toBe('unknown');
    });

    it('should classify address-lookup-table from parsed program directly', () => {
        expect(
            classifyAccountKindBase({
                owner: 'owner',
                parsedData: {},
                parsedProgram: 'address-lookup-table',
                rawDataBytes: null,
            }),
        ).toBe('address-lookup-table');
    });

    it('should cover deterministic classification branches across parsed programs and owners', () => {
        expect(
            classifyAccountKindBase({
                owner: 'owner',
                parsedData: { info: {}, type: 'mint' },
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            }),
        ).toBe('spl-token:mint');

        expect(
            classifyAccountKindBase({
                owner: 'owner',
                parsedData: { info: {}, type: 'account' },
                parsedProgram: 'spl-token-2022',
                rawDataBytes: null,
            }),
        ).toBe('spl-token-2022:account');

        expect(
            classifyAccountKindBase({ owner: 'owner', parsedData: {}, parsedProgram: 'nonce', rawDataBytes: null }),
        ).toBe('nonce');

        expect(
            classifyAccountKindBase({ owner: 'owner', parsedData: {}, parsedProgram: 'vote', rawDataBytes: null }),
        ).toBe('vote');

        expect(
            classifyAccountKindBase({ owner: 'owner', parsedData: {}, parsedProgram: 'sysvar', rawDataBytes: null }),
        ).toBe('sysvar');

        expect(
            classifyAccountKindBase({ owner: 'owner', parsedData: {}, parsedProgram: 'config', rawDataBytes: null }),
        ).toBe('config');

        expect(
            classifyAccountKindBase({
                owner: FEATURE_PROGRAM_ID,
                parsedData: {},
                parsedProgram: null,
                rawDataBytes: null,
            }),
        ).toBe('feature');

        expect(
            classifyAccountKindBase({
                owner: SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
                parsedData: {},
                parsedProgram: null,
                rawDataBytes: null,
            }),
        ).toBe('solana-attestation-service');
    });

    it('should normalize DAS outcomes from loosely shaped payloads', () => {
        expect(normalizeDasOutcome(null)).toBeNull();
        expect(normalizeDasOutcome('not-a-record')).toBeNull();
        expect(normalizeDasOutcome({})).toEqual({ compressed: false });
        expect(
            normalizeDasOutcome({
                compression: { compressed: true, tree: 'tree-address' },
                id: 'asset-id',
                ownership: { owner: 'owner-address' },
            }),
        ).toEqual({ assetId: 'asset-id', compressed: true, owner: 'owner-address', tree: 'tree-address' });
        // legacy assetId key fallback
        expect(normalizeDasOutcome({ assetId: 'legacy-id' })).toEqual({ assetId: 'legacy-id', compressed: false });
    });

    it('should promote unknown account kind to compressed-nft from DAS outcome only', () => {
        expect(promoteAccountKindWithDas('unknown', { compressed: true })).toBe('compressed-nft');
        expect(promoteAccountKindWithDas('stake', { compressed: true })).toBe('stake');
        expect(promoteAccountKindWithDas('unknown', { compressed: false })).toBe('unknown');
        expect(promoteAccountKindWithDas('unknown', null)).toBe('unknown');
    });
});
