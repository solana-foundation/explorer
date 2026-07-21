import { describe, expect, it } from 'vitest';

import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../../constants.js';
import {
    assertUnreachable,
    buildMintOverviewFields,
    buildTokenEntityFields,
    resolveProgramAddressLabel,
    unknownMarker,
} from '../shared.js';

describe('account kind shared helpers', () => {
    it('should throw for unreachable account kinds', () => {
        // oxlint-disable-next-line typescript/consistent-type-assertions -- `never` param is uncallable without a cast
        expect(() => assertUnreachable('impossible' as never)).toThrow('Unhandled account entity kind');
    });

    it('should resolve labels via the injected resolver, then the built-in map, then null', () => {
        const account = { owner: null, parsedData: null, parsedProgram: null, rawDataBytes: null };

        // Injected resolver wins over the built-in map
        expect(
            resolveProgramAddressLabel({
                account: { ...account, address: TOKEN_PROGRAM_ID },
                kind: 'unknown',
                resolveProgramName: () => 'Custom Label',
            }),
        ).toBe('Custom Label');

        // Built-in map covers well-known programs without a resolver
        expect(
            resolveProgramAddressLabel({ account: { ...account, address: TOKEN_PROGRAM_ID }, kind: 'unknown' }),
        ).toBe('Token Program');

        // Unknown address and missing address both yield null
        expect(
            resolveProgramAddressLabel({ account: { ...account, address: 'Unknown111' }, kind: 'unknown' }),
        ).toBeNull();
        expect(resolveProgramAddressLabel({ account, kind: 'unknown' })).toBeNull();
    });

    it('should build deterministic unknown markers', () => {
        expect(unknownMarker('source_unavailable')).toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
            value: null,
        });
    });

    it('should build token fields with and without token_program', () => {
        expect(
            buildTokenEntityFields('spl-token:account', {
                owner: 'TokenProgram',
                parsedData: { info: { mint: 'mint-address', owner: 'owner-address' } },
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            }),
        ).toEqual({
            mint: 'mint-address',
            owner: 'owner-address',
            token_program: 'TokenProgram',
        });

        expect(
            buildTokenEntityFields('spl-token:mint', {
                owner: null,
                parsedData: { info: {} },
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            }),
        ).toEqual({});
    });

    it('should never attach token_program for non-token kinds', () => {
        expect(
            buildTokenEntityFields('nftoken', {
                owner: 'SomeOwner',
                parsedData: { info: { mint: 'mint-address', owner: 'owner-address' } },
                parsedProgram: null,
                rawDataBytes: null,
            }),
        ).toEqual({ mint: 'mint-address', owner: 'owner-address' });
    });
});

describe('buildMintOverviewFields', () => {
    it('should extract all core fields from a complete mint', () => {
        expect(
            buildMintOverviewFields({
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                owner: TOKEN_PROGRAM_ID,
                parsedData: {
                    info: {
                        decimals: 6,
                        freezeAuthority: '3sNBr7kMccME5D55xNgsmYpZnzPgP2g12CixAajXypn6',
                        isInitialized: true,
                        mintAuthority: '2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2kPdENMD',
                        supply: '5034943880217036',
                    },
                },
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            }),
        ).toEqual({
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            decimals: 6,
            freeze_authority: '3sNBr7kMccME5D55xNgsmYpZnzPgP2g12CixAajXypn6',
            is_initialized: true,
            mint_authority: '2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2kPdENMD',
            supply: '5034943880217036',
            supply_type: 'variable',
            token_program: TOKEN_PROGRAM_ID,
        });
    });

    it("should return supply_type 'fixed' when mintAuthority is null", () => {
        const result = buildMintOverviewFields({
            address: 'SomeFixedMint',
            owner: TOKEN_PROGRAM_ID,
            parsedData: {
                info: {
                    decimals: 9,
                    freezeAuthority: null,
                    isInitialized: true,
                    mintAuthority: null,
                    supply: '1000000',
                },
            },
            parsedProgram: 'spl-token',
            rawDataBytes: null,
        });
        expect(result.supply_type).toBe('fixed');
        expect(result.mint_authority).toBeNull();
        expect(result.freeze_authority).toBeNull();
    });

    it('should return supply_type null when mint is not initialized', () => {
        const result = buildMintOverviewFields({
            address: 'UninitMint',
            owner: TOKEN_PROGRAM_ID,
            parsedData: {
                info: {
                    decimals: 0,
                    freezeAuthority: null,
                    isInitialized: false,
                    mintAuthority: null,
                    supply: '0',
                },
            },
            parsedProgram: 'spl-token',
            rawDataBytes: null,
        });
        expect(result.supply_type).toBeNull();
    });

    it('should return null fields when parsedData is null', () => {
        const result = buildMintOverviewFields({
            address: 'SomeAddr',
            owner: null,
            parsedData: null,
            parsedProgram: null,
            rawDataBytes: null,
        });
        expect(result).toEqual({
            address: 'SomeAddr',
            decimals: null,
            freeze_authority: null,
            is_initialized: null,
            mint_authority: null,
            supply: null,
            supply_type: null,
        });
        expect(result).not.toHaveProperty('token_program');
    });

    it('should return supply_type null when mintAuthority key is absent from parsed info', () => {
        const result = buildMintOverviewFields({
            address: 'PartialMint',
            owner: TOKEN_PROGRAM_ID,
            parsedData: {
                info: {
                    decimals: 6,
                    isInitialized: true,
                    supply: '1000',
                },
            },
            parsedProgram: 'spl-token',
            rawDataBytes: null,
        });
        expect(result.supply_type).toBeNull();
        expect(result.is_initialized).toBe(true);
    });

    it('should populate token_program from account.owner', () => {
        const result = buildMintOverviewFields({
            owner: TOKEN_2022_PROGRAM_ID,
            parsedData: {
                info: {
                    decimals: 0,
                    freezeAuthority: null,
                    isInitialized: true,
                    mintAuthority: null,
                    supply: '0',
                },
            },
            parsedProgram: 'spl-token-2022',
            rawDataBytes: null,
        });
        expect(result.token_program).toBe(TOKEN_2022_PROGRAM_ID);
    });
});
