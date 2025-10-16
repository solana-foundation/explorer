import { Account, Address, address, lamports } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { fetchMetadataFromSeeds, Metadata, unpackAndFetchData } from '@solana-program/program-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { errors, getProgramMetadataIdl, programMetadataIdlFunctions } from './getProgramMetadataIdl';

// Mock external dependencies
vi.mock('@solana/kit', () => ({
    address: vi.fn((addr: string) => addr),
    createSolanaRpc: vi.fn(() => 'https://mainnet.rpc.address'),
    lamports: vi.fn((lamports: bigint) => lamports),
    mainnet: vi.fn((url: string) => url),
}));

vi.mock('@solana-program/program-metadata', () => ({
    fetchMetadataFromSeeds: vi.fn(),
    unpackAndFetchData: vi.fn(),
}));

const { getProgramMetadataIdlOnMainnet } = programMetadataIdlFunctions;

describe('[internal] getProgramMetadataIdlOnMainnet', () => {
    const mockProgramAddress = PublicKey.default.toString();
    const mockUrl = 'https://any.rpc.address';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw 500 error when metadata fetch fails', async () => {
        // Mock the response
        const fetchError = new Error('Network error');
        vi.mocked(fetchMetadataFromSeeds).mockRejectedValueOnce(fetchError);

        await expect(getProgramMetadataIdlOnMainnet(mockProgramAddress, mockUrl)).rejects.toThrow(fetchError);

        // Verify fetchMetadataFromSeeds was called with correct params
        expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
            authority: null,
            program: mockProgramAddress,
            seed: 'idl',
        });
    });

    it.skip('should throw 422 error when JSON parsing fails', async () => {
        const mockMetadata: Account<Metadata> = {
            address: PublicKey.default.toString() as Address,
            data: {
                seed: 'some value',
            } as Metadata,
            executable: false,
            lamports: lamports(0n),
            programAddress: address(PublicKey.default.toString()),
            space: 1n,
        };

        vi.mocked(fetchMetadataFromSeeds).mockResolvedValueOnce(mockMetadata);
        vi.mocked(unpackAndFetchData).mockResolvedValueOnce('invalid json {');

        await expect(getProgramMetadataIdlOnMainnet(mockProgramAddress, mockUrl)).rejects.toThrow(errors[422]);

        // Verify unpackAndFetchData was called with correct params
        expect(unpackAndFetchData).toHaveBeenCalledWith({
            rpc: 'https://mainnet.rpc.address',
            ...mockMetadata.data,
        });
    });

    it('should return parsed IDL when everything works correctly', async () => {
        const mockMetadata: Account<Metadata> = {
            address: PublicKey.default.toString() as Address,
            data: {
                seed: 'some value',
            } as Metadata,
            executable: false,
            lamports: lamports(0n),
            programAddress: address(PublicKey.default.toString()),
            space: 1n,
        };

        const expectedIdl = {
            instructions: [],
            name: 'test_program',
            version: '0.1.0',
        };

        vi.mocked(fetchMetadataFromSeeds).mockResolvedValueOnce(mockMetadata);
        vi.mocked(unpackAndFetchData).mockResolvedValueOnce(JSON.stringify(expectedIdl));

        const result = await getProgramMetadataIdlOnMainnet(mockProgramAddress, mockUrl);

        expect(result).toEqual(expectedIdl);

        // Verify all functions were called with correct params
        expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
            authority: null,
            program: mockProgramAddress,
            seed: 'idl',
        });

        expect(unpackAndFetchData).toHaveBeenCalledWith({
            rpc: 'https://mainnet.rpc.address',
            ...mockMetadata.data,
        });
    });
});

describe('[public] getProgramMetadataIdl', () => {
    const mockProgramAddress = PublicKey.default.toString();
    const mockUrl = 'https://any.rpc.address';
    const mockIdlResponse = {
        instructions: [],
        name: 'test_program',
        version: '0.1.0',
    };

    describe('Expected failures during cluster parameter validation', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should throw 501 error when cluster is undefined', async () => {
            const spy = vi.spyOn(programMetadataIdlFunctions, 'getProgramMetadataIdlOnMainnet');

            await expect(getProgramMetadataIdl(mockProgramAddress, mockUrl, undefined)).rejects.toThrow(errors[501]);

            // Verify internal function was not called
            expect(spy).not.toHaveBeenCalled();
        });

        it('should throw 501 error when cluster is Testnet', async () => {
            const spy = vi.spyOn(programMetadataIdlFunctions, 'getProgramMetadataIdlOnMainnet');

            await expect(getProgramMetadataIdl(mockProgramAddress, mockUrl, Cluster.Testnet)).rejects.toThrow(
                errors[501]
            );

            // Verify internal function was not called
            expect(spy).not.toHaveBeenCalled();
        });

        it('should throw 501 error when cluster is Devnet', async () => {
            const spy = vi.spyOn(programMetadataIdlFunctions, 'getProgramMetadataIdlOnMainnet');

            await expect(getProgramMetadataIdl(mockProgramAddress, mockUrl, Cluster.Devnet)).rejects.toThrow(
                errors[501]
            );

            // Verify internal function was not called
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('Happy path', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should call getProgramMetadataIdlOnMainnet with correct arguments when cluster is MainnetBeta', async () => {
            const spy = vi
                .spyOn(programMetadataIdlFunctions, 'getProgramMetadataIdlOnMainnet')
                .mockResolvedValueOnce(mockIdlResponse);

            const result = await getProgramMetadataIdl(mockProgramAddress, mockUrl, Cluster.MainnetBeta);
            expect(result).toEqual(mockIdlResponse);

            // Verify internal function was called with correct arguments
            expect(spy).toBeCalledTimes(1);
            expect(spy).toBeCalledWith(mockProgramAddress, mockUrl);
        });

        it('should call getProgramMetadataIdlOnMainnet when cluster is Custom', async () => {
            const spy = vi
                .spyOn(programMetadataIdlFunctions, 'getProgramMetadataIdlOnMainnet')
                .mockResolvedValueOnce(mockIdlResponse);

            const result = await getProgramMetadataIdl(mockProgramAddress, mockUrl, Cluster.Custom);
            expect(result).toEqual(mockIdlResponse);

            // Verify internal function was called
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toBeCalledWith(mockProgramAddress, mockUrl);
        });
    });
});
