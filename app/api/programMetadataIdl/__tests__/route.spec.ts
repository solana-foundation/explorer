import { isSolanaError, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProgramMetadataIdl } from '@/app/components/instruction/codama/getProgramMetadataIdl';
import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

import { GET, routeFunctions } from '../route';

const MAINNET_RPC = 'http://mainnet.rpc.address';
const DEVNET_RPC = 'http://devnet.rpc.address';
const TESTNET_RPC = 'http://testnet.rpc.address';
const CUSTOM_RPC = 'http://custom.rpc.address';

// Mock dependencies
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn(),
    },
}));

vi.mock('@/app/components/instruction/codama/getProgramMetadataIdl');
vi.mock('@/app/utils/cluster', async () => {
    const actual = await vi.importActual('@/app/utils/cluster');
    return {
        ...actual,
        serverClusterUrl: vi.fn(),
    };
});

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual('@solana/kit');
    return {
        ...actual,
        isSolanaError: vi.fn(),
    };
});

// Create a mock SolanaError
const createMockSolanaError = (code: number = SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND) => {
    const error = new Error('Solana error') as any;
    error.context = {
        __code: code,
        address: PublicKey.default.toString(),
    };
    return error;
};

describe('[api] programMetadataIdl', () => {
    // Test data factories
    const createValidRequest = (params: Record<string, string> = {}, url: string) => {
        const defaultParams = {
            cluster: '0',
            programAddress: PublicKey.default.toString(),
        };
        const urlParams = new URLSearchParams({ ...defaultParams, ...params });
        return new Request(`${url}/api/programMetadataIdl?${urlParams}`);
    };

    const createMockIdl = () => ({
        instructions: [],
        name: 'test_program',
        version: '0.1.0',
    });

    const expectedCacheHeaders = {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=60',
    };

    // Setup and teardown
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Input validation', () => {
        it('should return 400 when programAddress is missing', async () => {
            const request = createValidRequest({ programAddress: '' }, MAINNET_RPC);
            const urlWithoutProgramAddress = request.url.replace('programAddress=&', '');
            const invalidRequest = new Request(urlWithoutProgramAddress);

            await GET(invalidRequest);

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid query params' }, { status: 400 });
        });

        it('should return 400 when cluster is missing', async () => {
            const request = createValidRequest({ cluster: '' }, MAINNET_RPC);
            const urlWithoutCluster = request.url.replace('cluster=&', '');
            const invalidRequest = new Request(urlWithoutCluster);

            await GET(invalidRequest);

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid query params' }, { status: 400 });
        });

        it('should return 400 when both parameters are missing', async () => {
            const request = new Request('http://localhost/api/programMetadataIdl');

            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid query params' }, { status: 400 });
        });

        it('should return 400 when cluster value is invalid', async () => {
            const request = createValidRequest({ cluster: '999' }, MAINNET_RPC);
            vi.mocked(serverClusterUrl).mockReturnValue(false as any);

            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid cluster' }, { status: 400 });
        });

        it('should return 400 when cluster value is non-numeric', async () => {
            const request = createValidRequest({ cluster: 'invalid' }, MAINNET_RPC);
            vi.mocked(serverClusterUrl).mockReturnValue(false as any);

            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid cluster' }, { status: 400 });
        });
    });

    describe('Happy path', () => {
        it('should return IDL data with correct cache headers', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl').mockReturnValueOnce(MAINNET_RPC);

            const mockIdl = createMockIdl();
            vi.mocked(getProgramMetadataIdl).mockResolvedValue(mockIdl);

            const request = createValidRequest(undefined, MAINNET_RPC);
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { codamaIdl: mockIdl },
                {
                    headers: expectedCacheHeaders,
                    status: 200,
                }
            );
        });

        it('should call getProgramMetadataIdl with correct parameters', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl').mockReturnValueOnce(MAINNET_RPC);

            const mockIdl = createMockIdl();
            vi.mocked(getProgramMetadataIdl).mockResolvedValue(mockIdl);

            const programAddress = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
            const request = createValidRequest({ programAddress }, MAINNET_RPC);

            await GET(request);

            expect(getProgramMetadataIdl).toHaveBeenCalledWith(programAddress, MAINNET_RPC, Cluster.MainnetBeta);
        });

        it('should handle different cluster values correctly', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl');

            const mockIdl = createMockIdl();
            vi.mocked(getProgramMetadataIdl).mockResolvedValue(mockIdl);

            const testCases = [
                { cluster: '0', enumValue: Cluster.MainnetBeta, url: MAINNET_RPC },
                { cluster: '1', enumValue: Cluster.Testnet, url: TESTNET_RPC },
                { cluster: '2', enumValue: Cluster.Devnet, url: DEVNET_RPC },
                { cluster: '3', enumValue: Cluster.Custom, url: CUSTOM_RPC },
            ];

            for (const testCase of testCases) {
                vi.clearAllMocks();
                spy.mockReturnValueOnce(testCase.url);

                const request = createValidRequest({ cluster: testCase.cluster }, testCase.url);
                await GET(request);

                expect(getProgramMetadataIdl).toHaveBeenCalledWith(
                    expect.any(String),
                    testCase.url,
                    testCase.enumValue
                );
            }
        });
    });

    describe('Error handling', () => {
        it('should return null codamaIdl when SolanaError with expected code is thrown', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl').mockReturnValueOnce(MAINNET_RPC);

            const solanaError = createMockSolanaError();
            vi.mocked(getProgramMetadataIdl).mockRejectedValue(solanaError);

            // Mock isSolanaError to return true for expected error codes
            vi.mocked(isSolanaError).mockImplementation(error => {
                return error === solanaError;
            });

            const request = createValidRequest({}, MAINNET_RPC);
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                { codamaIdl: null },
                {
                    headers: expectedCacheHeaders,
                    status: 200,
                }
            );
        });

        it('should handle Error objects correctly', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl').mockReturnValueOnce(MAINNET_RPC);

            const errorMessage = 'Failed to fetch IDL';
            const error = new Error(errorMessage);

            vi.mocked(getProgramMetadataIdl).mockRejectedValue(error);

            const request = createValidRequest({}, MAINNET_RPC);
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    details: error,
                    error: errorMessage,
                },
                {
                    headers: expectedCacheHeaders,
                    status: 200,
                }
            );
        });

        it('should handle non-Error objects correctly', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl').mockReturnValueOnce(MAINNET_RPC);

            const error = { code: 'NETWORK_ERROR', message: 'Network failure' };
            vi.mocked(getProgramMetadataIdl).mockRejectedValue(error);

            const request = createValidRequest({}, MAINNET_RPC);
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    details: new Error('Unknown error', { cause: error }),
                    error: 'Unknown error',
                },
                {
                    headers: expectedCacheHeaders,
                    status: 200,
                }
            );
        });

        it('should handle string errors correctly', async () => {
            const _spy = vi.spyOn(routeFunctions, 'getMetadataEndpointUrl').mockReturnValueOnce(MAINNET_RPC);

            const error = 'String error message';
            vi.mocked(getProgramMetadataIdl).mockRejectedValue(error);

            const request = createValidRequest({}, MAINNET_RPC);
            await GET(request);

            expect(NextResponse.json).toHaveBeenCalledWith(
                {
                    details: new Error(error),
                    error,
                },
                {
                    headers: expectedCacheHeaders,
                    status: 200,
                }
            );
        });
    });
});
