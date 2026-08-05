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

const { fetchLatestIdlClientMock } = vi.hoisted(() => ({
    fetchLatestIdlClientMock: vi.fn(),
}));

vi.mock('@explorer/idl-decode/fetch', async importOriginal => ({
    ...(await importOriginal<Record<string, unknown>>()),
    fetchLatestIdlClient: fetchLatestIdlClientMock,
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
        fetchLatestIdlClientMock.mockResolvedValue([undefined, { client, source: IdlSource.Pmp }]);
        const resolve = createIdlClientResolver(RPC_ENDPOINTS, createLoggerMock());

        await expect(resolve('program-address', 'devnet')).resolves.toBe(client);
        expect(fetchLatestIdlClientMock).toHaveBeenCalledWith(
            'program-address',
            expect.objectContaining({ abortSignal: expect.any(Object) }),
        );
    });

    it('should resolve null on data errors without warning', async () => {
        const logger = createLoggerMock();
        fetchLatestIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_NOT_FOUND), undefined]);
        const resolve = createIdlClientResolver(RPC_ENDPOINTS, logger);

        await expect(resolve('program-address', 'mainnet-beta')).resolves.toBeNull();
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should resolve null and warn when the fetch rejects', async () => {
        const logger = createLoggerMock();
        fetchLatestIdlClientMock.mockRejectedValue(new Error('timed out'));
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

    it('should map a PMP-sourced client to pmp_canonical with detection and name', async () => {
        fetchLatestIdlClientMock.mockResolvedValue([
            undefined,
            { client: fakeClient(CODAMA_IDL, 'My Program'), source: IdlSource.Pmp },
        ]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toMatchObject({
            discovery: {
                idl_type: 'codama',
                program_name: 'My Program',
                source_type: 'pmp_canonical',
                status: 'found',
            },
        });
    });

    it('should map an anchor-PDA-sourced client to anchor_on_chain', async () => {
        fetchLatestIdlClientMock.mockResolvedValue([
            undefined,
            { client: fakeClient(ANCHOR_IDL), source: IdlSource.AnchorPda },
        ]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toMatchObject({
            discovery: {
                idl_type: 'anchor',
                program_name: null,
                source_type: 'anchor_on_chain',
                status: 'found',
            },
        });
    });

    it('should report not_found when no leg publishes an IDL', async () => {
        fetchLatestIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_NOT_FOUND), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { status: 'not_found' },
        });
    });

    it('should map transport failures to unknown/source_unavailable', async () => {
        fetchLatestIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_FETCH_FAILED), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'source_unavailable', status: 'unknown' },
        });
    });

    it('should map an address mismatch to unknown/address_unverified', async () => {
        fetchLatestIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_ADDRESS_MISMATCH), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'address_unverified', status: 'unknown' },
        });
    });

    it('should map corrupt IDLs to unknown/idl_invalid', async () => {
        fetchLatestIdlClientMock.mockResolvedValue([idlError(IDL_ERROR__IDL_PARSE_FAILED), undefined]);
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, createLoggerMock());

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'idl_invalid', status: 'unknown' },
        });
    });

    it('should warn and report source_unavailable when the fetch rejects', async () => {
        const logger = createLoggerMock();
        fetchLatestIdlClientMock.mockRejectedValue(new Error('timed out'));
        const discover = createProgramIdlDiscovery(RPC_ENDPOINTS, logger);

        await expect(discover('program-address', 'mainnet-beta')).resolves.toEqual({
            client: null,
            discovery: { reason: 'source_unavailable', status: 'unknown' },
        });
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});
