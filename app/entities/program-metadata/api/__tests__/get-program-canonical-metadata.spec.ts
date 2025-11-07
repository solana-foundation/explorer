import { Account, Address, address, lamports } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { fetchMetadataFromSeeds, Metadata, unpackAndFetchData } from '@solana-program/program-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    errors,
    getProgramCanonicalMetadata,
    getProgramMetadataIdl,
    getProgramMetadataSecurityTxt,
    IDL_SEED,
    SECURITY_TXT_SEED,
} from '../getProgramCanonicalMetadata';

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

vi.mock('@/app/shared/unknown-error', () => ({
    normalizeUnknownError: vi.fn((error, message) => {
        const normalizedError = new Error(message);
        normalizedError.cause = error;
        return normalizedError;
    }),
}));

describe('getProgramCanonicalMetadata', () => {
    const mockProgramAddress = PublicKey.default.toString();
    const mockUrl = 'https://any.rpc.address';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('error handling', () => {
        it('should throw normalized 500 error when metadata fetch fails', async () => {
            const fetchError = new Error('Network error');
            vi.mocked(fetchMetadataFromSeeds).mockRejectedValueOnce(fetchError);

            await expect(getProgramCanonicalMetadata(mockProgramAddress, 'idl', mockUrl)).rejects.toThrow(errors[500]);

            // Verify fetchMetadataFromSeeds was called with correct params
            expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
                authority: null,
                program: mockProgramAddress,
                seed: 'idl',
            });
        });

        it('should throw 422 error when JSON parsing fails', async () => {
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

            await expect(getProgramCanonicalMetadata(mockProgramAddress, 'idl', mockUrl)).rejects.toThrow(errors[422]);

            // Verify unpackAndFetchData was called with correct params
            expect(unpackAndFetchData).toHaveBeenCalledWith({
                rpc: 'https://mainnet.rpc.address',
                ...mockMetadata.data,
            });
        });

        it('should throw 422 error when unpackAndFetchData fails', async () => {
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
            vi.mocked(unpackAndFetchData).mockRejectedValueOnce(new Error('Unpacking failed'));

            await expect(getProgramCanonicalMetadata(mockProgramAddress, 'idl', mockUrl)).rejects.toThrow(errors[422]);
        });
    });

    describe('happy path', () => {
        it('should return parsed metadata for IDL seed', async () => {
            const mockMetadata: Account<Metadata> = {
                address: PublicKey.default.toString() as Address,
                data: {
                    seed: 'idl',
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

            const result = await getProgramCanonicalMetadata(mockProgramAddress, 'idl', mockUrl);

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

        it('should return parsed metadata for security.txt seed', async () => {
            const mockMetadata: Account<Metadata> = {
                address: PublicKey.default.toString() as Address,
                data: {
                    seed: 'security',
                } as Metadata,
                executable: false,
                lamports: lamports(0n),
                programAddress: address(PublicKey.default.toString()),
                space: 1n,
            };

            const expectedSecurityTxt = {
                contacts: 'security@example.com',
                name: 'Test Program',
                policy: 'https://example.com/security-policy',
                project_url: 'https://example.com',
            };

            vi.mocked(fetchMetadataFromSeeds).mockResolvedValueOnce(mockMetadata);
            vi.mocked(unpackAndFetchData).mockResolvedValueOnce(JSON.stringify(expectedSecurityTxt));

            const result = await getProgramCanonicalMetadata(mockProgramAddress, 'security', mockUrl);

            expect(result).toEqual(expectedSecurityTxt);

            // Verify fetchMetadataFromSeeds was called with security seed
            expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
                authority: null,
                program: mockProgramAddress,
                seed: 'security',
            });
        });

        it('should work with custom seeds', async () => {
            const customSeed = 'custom';
            const mockMetadata: Account<Metadata> = {
                address: PublicKey.default.toString() as Address,
                data: {
                    seed: customSeed,
                } as Metadata,
                executable: false,
                lamports: lamports(0n),
                programAddress: address(PublicKey.default.toString()),
                space: 1n,
            };

            const expectedData = { custom: 'data' };

            vi.mocked(fetchMetadataFromSeeds).mockResolvedValueOnce(mockMetadata);
            vi.mocked(unpackAndFetchData).mockResolvedValueOnce(JSON.stringify(expectedData));

            const result = await getProgramCanonicalMetadata(mockProgramAddress, customSeed, mockUrl);

            expect(result).toEqual(expectedData);

            expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
                authority: null,
                program: mockProgramAddress,
                seed: customSeed,
            });
        });
    });
});

describe('getProgramMetadataIdl wrapper', () => {
    const mockProgramAddress = PublicKey.default.toString();
    const mockUrl = 'https://any.rpc.address';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call getProgramCanonicalMetadata with IDL seed', async () => {
        const mockMetadata: Account<Metadata> = {
            address: PublicKey.default.toString() as Address,
            data: {
                seed: IDL_SEED,
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

        const result = await getProgramMetadataIdl(mockProgramAddress, mockUrl);

        expect(result).toEqual(expectedIdl);

        // Verify it called fetchMetadataFromSeeds with 'idl' seed
        expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
            authority: null,
            program: mockProgramAddress,
            seed: IDL_SEED,
        });
    });
});

describe('getProgramMetadataSecurityTxt wrapper', () => {
    const mockProgramAddress = PublicKey.default.toString();
    const mockUrl = 'https://any.rpc.address';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call getProgramCanonicalMetadata with security seed', async () => {
        const mockMetadata: Account<Metadata> = {
            address: PublicKey.default.toString() as Address,
            data: {
                seed: SECURITY_TXT_SEED,
            } as Metadata,
            executable: false,
            lamports: lamports(0n),
            programAddress: address(PublicKey.default.toString()),
            space: 1n,
        };

        const expectedSecurityTxt = {
            contacts: 'security@example.com',
            name: 'Test Program',
            policy: 'https://example.com/security-policy',
            project_url: 'https://example.com',
        };

        vi.mocked(fetchMetadataFromSeeds).mockResolvedValueOnce(mockMetadata);
        vi.mocked(unpackAndFetchData).mockResolvedValueOnce(JSON.stringify(expectedSecurityTxt));

        const result = await getProgramMetadataSecurityTxt(mockProgramAddress, mockUrl);

        expect(result).toEqual(expectedSecurityTxt);

        // Verify it called fetchMetadataFromSeeds with 'security' seed
        expect(fetchMetadataFromSeeds).toHaveBeenCalledWith('https://mainnet.rpc.address', {
            authority: null,
            program: mockProgramAddress,
            seed: SECURITY_TXT_SEED,
        });
    });
});
