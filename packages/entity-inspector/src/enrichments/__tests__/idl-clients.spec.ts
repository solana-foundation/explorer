import {
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_FETCH_FAILED,
    IDL_ERROR__IDL_NOT_FOUND,
    IDL_ERROR__IDL_PARSE_FAILED,
    type IdlClient,
    type IdlError,
} from '@explorer/idl-decode';
import { IdlSource } from '@explorer/idl-decode/fetch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import type { InspectorLogger } from '../../logger.js';
import { createIdlClientResolver, createProgramIdlDiscovery } from '../idl-clients.js';

const { fetchOnChainIdlClientMock } = vi.hoisted(() => ({
    fetchOnChainIdlClientMock: vi.fn(),
}));

vi.mock('@explorer/idl-decode/fetch', async importOriginal => ({
    ...(await importOriginal<Record<string, unknown>>()),
    fetchOnChainIdlClient: fetchOnChainIdlClientMock,
}));

vi.mock('@solana/kit', () => ({
    address: vi.fn((value: string) => value),
    createSolanaRpc: vi.fn(() => ({})),
}));

const RPC_ENDPOINTS = {
    devnet: 'https://devnet.rpc.address',
    'mainnet-beta': 'https://mainnet-beta.rpc.address',
    simd296: 'https://simd296.rpc.address',
    testnet: 'https://testnet.rpc.address',
};

/** The Foundation's PMP authority — the fallback lookup a frozen program's IDL lives under. */
const FNDN_AUTHORITY = 'fndnu15PLXELbLsTqrfbiweBvsBj2o12RoVfkeCCbX2';

const CODAMA_IDL = { kind: 'rootNode', program: { publicKey: gen.systemProgram } };
const ANCHOR_IDL = { address: gen.systemProgram, instructions: [], metadata: { spec: '0.1.0' } };

function fakeClient(idl: unknown, programName?: string): IdlClient {
    return { idl, programName: () => programName } as unknown as IdlClient;
}

function idlError(code: number): IdlError {
    return { code } as IdlError;
}

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe('createIdlClientResolver', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should resolve the client on a successful fetch', async () => {
        const client = fakeClient(CODAMA_IDL);
        fetchOnChainIdlClientMock.mockResolvedValue([undefined, { client, source: IdlSource.Pmp }]);
        const resolve = createIdlClientResolver(RPC_ENDPOINTS, createLoggerMock());

        await expect(resolve('program-address', 'devnet')).resolves.toBe(client);
        expect(fetchOnChainIdlClientMock).toHaveBeenCalledWith(
            'program-address',
            expect.objectContaining({ abortSignal: expect.any(Object) }),
        );
    });

    it('should resolve null on data errors without warning', async () => {
        const logger = createLoggerMock();
        fetchOnChainIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_NOT_FOUND), undefined]);
        const resolve = createIdlClientResolver(RPC_ENDPOINTS, logger);

        await expect(resolve('program-address', 'mainnet-beta')).resolves.toBeNull();
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should resolve null and warn when the fetch rejects', async () => {
        const logger = createLoggerMock();
        fetchOnChainIdlClientMock.mockRejectedValue(new Error('timed out'));
        const resolve = createIdlClientResolver(RPC_ENDPOINTS, logger);

        await expect(resolve('program-address', 'testnet')).resolves.toBeNull();
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] idl client resolution timed out',
            expect.objectContaining({ programAddress: 'program-address' }),
        );
    });
});

describe('createProgramIdlDiscovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should map a canonical PMP client to pmp_canonical with detection and name', async () => {
        fetchOnChainIdlClientMock.mockResolvedValue([
            undefined,
            { authority: null, client: fakeClient(CODAMA_IDL, 'My Program'), source: IdlSource.Pmp },
        ]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toMatchObject({
            discovery: {
                authority: null,
                idl_type: 'codama',
                program_name: 'My Program',
                source: 'pmp',
                source_type: 'pmp_canonical',
                status: 'found',
            },
        });
    });

    it('should map a fallback-authority PMP client to pmp_fallback, carrying the key', async () => {
        // what a frozen program looks like: no upgrade authority, so only a fallback PDA can hold its IDL
        fetchOnChainIdlClientMock.mockResolvedValue([
            undefined,
            { authority: FNDN_AUTHORITY, client: fakeClient(CODAMA_IDL, 'Token'), source: IdlSource.Pmp },
        ]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toMatchObject({
            discovery: {
                authority: FNDN_AUTHORITY,
                source: 'pmp',
                source_type: 'pmp_fallback',
                status: 'found',
            },
        });
    });

    it('should map an anchor-PDA-sourced client to anchor', async () => {
        fetchOnChainIdlClientMock.mockResolvedValue([
            undefined,
            { client: fakeClient(ANCHOR_IDL), source: IdlSource.Anchor },
        ]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        const { discovery } = await discover('program-address', 'mainnet-beta');

        expect(discovery).toEqual({
            idl_type: 'anchor',
            program_name: null,
            source: 'anchor',
            source_type: 'anchor',
            status: 'found',
        });
        expect('authority' in discovery).toBe(false); // the anchor PDA has no authority to report
    });

    it('should report not_found when no leg publishes an IDL', async () => {
        fetchOnChainIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_NOT_FOUND), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { status: 'not_found' },
        });
    });

    it('should map transport failures to unknown/source_unavailable', async () => {
        fetchOnChainIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_FETCH_FAILED), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'source_unavailable', status: 'unknown' },
        });
    });

    it('should map an address mismatch to unknown/address_unverified', async () => {
        fetchOnChainIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_ADDRESS_MISMATCH), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'address_unverified', status: 'unknown' },
        });
    });

    it('should map corrupt IDLs to unknown/idl_invalid', async () => {
        fetchOnChainIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_PARSE_FAILED), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'idl_invalid', status: 'unknown' },
        });
    });

    it('should warn and report source_unavailable when the fetch rejects', async () => {
        const logger = createLoggerMock();
        fetchOnChainIdlClientMock.mockRejectedValue(new Error('timed out'));
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, logger);

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'source_unavailable', status: 'unknown' },
        });
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});
