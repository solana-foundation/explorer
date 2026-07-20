import { describe, expect, it } from 'vitest';

import { NFTOKEN_ADDRESS, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../constants.js';
import { buildAccountPayloadWithRouter } from '../inspect-entity-account-router.js';
import { asRecord } from '../parse-helpers.js';
import type { AccountEntityKind, AccountPayloadContext } from '../types.js';

const ALL_ACCOUNT_KINDS = [
    'bpf-upgradeable-loader',
    'bpf-loader',
    'bpf-loader-2',
    'loader-v4',
    'stake',
    'nftoken',
    'spl-token:mint',
    'spl-token:account',
    'spl-token:multisig',
    'spl-token-2022:mint',
    'spl-token-2022:account',
    'spl-token-2022:multisig',
    'nonce',
    'vote',
    'sysvar',
    'config',
    'address-lookup-table',
    'feature',
    'solana-attestation-service',
    'compressed-nft',
    'unknown',
] as const satisfies ReadonlyArray<AccountEntityKind>;

type MissingKinds = Exclude<AccountEntityKind, (typeof ALL_ACCOUNT_KINDS)[number]>;
type _AssertNoMissingKinds = MissingKinds extends never ? true : never;
const assertNoMissingKinds: _AssertNoMissingKinds = true;
void assertNoMissingKinds;

function entityOf(payload: Record<string, unknown>): Record<string, unknown> {
    const entity = asRecord(payload.entity);
    if (!entity) {
        throw new Error('payload.entity is not a record');
    }
    return entity;
}

function contextForKind(kind: AccountEntityKind): AccountPayloadContext {
    if (kind === 'bpf-upgradeable-loader') {
        return {
            account: {
                address: TOKEN_2022_PROGRAM_ID,
                executable: true,
                lamports: 567591537,
                owner: 'owner',
                parsedData: {
                    info: { programData: 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY' },
                    type: 'program',
                },
                parsedProgram: 'bpf-upgradeable-loader',
                programData: { authority: 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ', slot: 395847597 },
                programDataAddress: 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY',
                programDataStatus: 'resolved',
                rawDataBytes: null,
            },
            kind,
        };
    }

    if (kind === 'compressed-nft') {
        return {
            account: { owner: 'owner', parsedData: null, parsedProgram: null, rawDataBytes: null },
            dasOutcome: { assetId: 'asset', compressed: true, owner: 'owner-address', tree: 'tree-address' },
            kind,
        };
    }

    if (kind === 'spl-token:mint' || kind === 'spl-token-2022:mint') {
        const isTok2022 = kind === 'spl-token-2022:mint';
        return {
            account: {
                address: 'MintAddress111111111111111111111111111111111',
                owner: isTok2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
                parsedData: {
                    info: {
                        decimals: 6,
                        freezeAuthority: null,
                        isInitialized: true,
                        mintAuthority: 'AuthAddr1111111111111111111111111111111111111',
                        supply: '1000000000',
                        ...(isTok2022
                            ? {
                                  extensions: [{ extension: 'transferFeeConfig', state: { withheldAmount: '0' } }],
                              }
                            : {}),
                    },
                    type: 'mint',
                },
                parsedProgram: isTok2022 ? 'spl-token-2022' : 'spl-token',
                rawDataBytes: null,
            },
            kind,
        };
    }

    if (kind.startsWith('spl-token')) {
        return {
            account: {
                owner: 'TokenProgram',
                parsedData: { info: { mint: 'mint-address', owner: 'owner-address' } },
                parsedProgram: kind.startsWith('spl-token-2022') ? 'spl-token-2022' : 'spl-token',
                rawDataBytes: null,
            },
            kind,
        };
    }

    return {
        account: { owner: 'owner', parsedData: null, parsedProgram: null, rawDataBytes: null },
        kind,
    };
}

describe('inspect-entity account router', () => {
    it('should return a payload with entity.kind for every account kind', () => {
        for (const kind of ALL_ACCOUNT_KINDS) {
            const context = contextForKind(kind);
            const payload = buildAccountPayloadWithRouter(context);
            expect(payload).toHaveProperty('entity.kind', kind);
        }
    });

    it('should report loader accounts as unsupported until enrichments land', () => {
        const loaderKinds = ['bpf-upgradeable-loader', 'bpf-loader', 'bpf-loader-2', 'loader-v4'] as const;

        for (const kind of loaderKinds) {
            expect(buildAccountPayloadWithRouter(contextForKind(kind))).toEqual({
                entity: { kind },
                errors: [`${kind} accounts are not supported yet`],
            });
        }
    });

    it('should build compressed-nft payload from DAS outcome', () => {
        const payload = buildAccountPayloadWithRouter({
            account: { owner: 'owner', parsedData: null, parsedProgram: null, rawDataBytes: null },
            dasOutcome: { assetId: 'asset', compressed: true, owner: 'owner-address', tree: 'tree-address' },
            kind: 'compressed-nft',
        });

        expect(payload).toMatchObject({
            entity: {
                asset_id: 'asset',
                kind: 'compressed-nft',
                owner: 'owner-address',
                tree: 'tree-address',
            },
        });
    });

    it('should omit absent DAS fields from compressed-nft payload', () => {
        const payload = buildAccountPayloadWithRouter({
            account: { owner: 'owner', parsedData: null, parsedProgram: null, rawDataBytes: null },
            dasOutcome: { compressed: true },
            kind: 'compressed-nft',
        });

        const entity = entityOf(payload);
        expect(entity).not.toHaveProperty('asset_id');
        expect(entity).not.toHaveProperty('owner');
        expect(entity).not.toHaveProperty('tree');
    });

    it('should build spl-token payload with token_program field', () => {
        const payload = buildAccountPayloadWithRouter({
            account: {
                owner: 'TokenProgram',
                parsedData: { info: { mint: 'mint-address', owner: 'owner-address' } },
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            },
            kind: 'spl-token:account',
        });

        expect(payload).toMatchObject({
            entity: {
                mint: 'mint-address',
                owner: 'owner-address',
                token_program: 'TokenProgram',
            },
        });
    });

    it('should build spl-token-2022 payload with token_program field', () => {
        const payload = buildAccountPayloadWithRouter({
            account: {
                owner: 'Token2022Program',
                parsedData: { info: { mint: 'mint-2022-address', owner: 'owner-2022-address' } },
                parsedProgram: 'spl-token-2022',
                rawDataBytes: null,
            },
            kind: 'spl-token-2022:account',
        });

        expect(payload).toMatchObject({
            entity: {
                mint: 'mint-2022-address',
                owner: 'owner-2022-address',
                token_program: 'Token2022Program',
            },
        });
    });

    it('should build spl-token:mint payload with core mint fields', () => {
        const payload = buildAccountPayloadWithRouter(contextForKind('spl-token:mint'));
        expect(payload).toMatchObject({
            entity: {
                address: 'MintAddress111111111111111111111111111111111',
                decimals: 6,
                freeze_authority: null,
                is_initialized: true,
                kind: 'spl-token:mint',
                mint_authority: 'AuthAddr1111111111111111111111111111111111111',
                supply: '1000000000',
                supply_type: 'variable',
                token_program: TOKEN_PROGRAM_ID,
            },
        });
        expect(entityOf(payload)).not.toHaveProperty('extensions');
    });

    it('should build spl-token-2022:mint payload with extensions', () => {
        const payload = buildAccountPayloadWithRouter(contextForKind('spl-token-2022:mint'));
        expect(payload).toMatchObject({
            entity: {
                decimals: 6,
                extensions: [{ extension: 'transferFeeConfig', state: { withheldAmount: '0' } }],
                kind: 'spl-token-2022:mint',
                supply: '1000000000',
            },
        });
    });

    it('should preserve extension state shape including BigInt values', () => {
        const payload = buildAccountPayloadWithRouter({
            account: {
                address: 'BigIntMint',
                owner: TOKEN_2022_PROGRAM_ID,
                parsedData: {
                    info: {
                        decimals: 6,
                        extensions: [
                            {
                                extension: 'transferFeeConfig',
                                state: {
                                    newerTransferFee: {
                                        epoch: BigInt(605),
                                        maximumFee: BigInt(0),
                                        transferFeeBasisPoints: 100,
                                    },
                                    withheldAmount: BigInt(0),
                                },
                            },
                            { extension: 'metadataPointer' },
                        ],
                        freezeAuthority: null,
                        isInitialized: true,
                        mintAuthority: null,
                        supply: '1000',
                    },
                    type: 'mint',
                },
                parsedProgram: 'spl-token-2022',
                rawDataBytes: null,
            },
            kind: 'spl-token-2022:mint',
        });

        const extensions = entityOf(payload).extensions;
        if (!Array.isArray(extensions)) {
            throw new Error('expected extensions array');
        }
        const state = asRecord(asRecord(extensions[0])?.state);
        // Builder preserves raw values; BigInt coercion happens in toToolResult
        expect(state?.withheldAmount).toBe(BigInt(0));
        const newerFee = asRecord(state?.newerTransferFee);
        expect(newerFee?.epoch).toBe(BigInt(605));
        expect(newerFee?.transferFeeBasisPoints).toBe(100);
        // Entries without state normalize to state: null
        expect(extensions[1]).toEqual({ extension: 'metadataPointer', state: null });
    });

    it('should build spl-token-2022:mint with null extensions when none present', () => {
        const payload = buildAccountPayloadWithRouter({
            account: {
                address: 'NoExtMint',
                owner: TOKEN_2022_PROGRAM_ID,
                parsedData: {
                    info: {
                        decimals: 0,
                        freezeAuthority: null,
                        isInitialized: true,
                        mintAuthority: null,
                        supply: '100',
                    },
                    type: 'mint',
                },
                parsedProgram: 'spl-token-2022',
                rawDataBytes: null,
            },
            kind: 'spl-token-2022:mint',
        });
        expect(payload).toMatchObject({
            entity: {
                extensions: null,
                kind: 'spl-token-2022:mint',
                supply_type: 'fixed',
            },
        });
    });

    it('should build spl-token-2022:mint with null extensions when entries are unusable', () => {
        const payload = buildAccountPayloadWithRouter({
            account: {
                address: 'BadExtMint',
                owner: TOKEN_2022_PROGRAM_ID,
                parsedData: {
                    info: {
                        decimals: 0,
                        extensions: [{ state: {} }, 'not-a-record'],
                        freezeAuthority: null,
                        isInitialized: true,
                        mintAuthority: null,
                        supply: '100',
                    },
                    type: 'mint',
                },
                parsedProgram: 'spl-token-2022',
                rawDataBytes: null,
            },
            kind: 'spl-token-2022:mint',
        });
        expect(entityOf(payload).extensions).toBeNull();
    });

    it('should omit token_program when owner is null', () => {
        const payload = buildAccountPayloadWithRouter({
            account: {
                owner: null,
                parsedData: { info: {} },
                parsedProgram: 'spl-token',
                rawDataBytes: null,
            },
            kind: 'spl-token:mint',
        });
        expect(payload).toMatchObject({
            entity: {
                decimals: null,
                freeze_authority: null,
                is_initialized: null,
                kind: 'spl-token:mint',
                mint_authority: null,
                supply: null,
                supply_type: null,
            },
        });
        expect(entityOf(payload)).not.toHaveProperty('token_program');
    });

    it('should throw for unhandled account kinds', () => {
        expect(() =>
            buildAccountPayloadWithRouter({
                account: { owner: 'owner', parsedData: null, parsedProgram: null, rawDataBytes: null },
                // oxlint-disable-next-line typescript/consistent-type-assertions -- exercising the unreachable guard requires an invalid kind
                kind: 'bogus' as AccountEntityKind,
            }),
        ).toThrow('Unhandled account entity kind');
    });

    it('should build nftoken payload with owner_program', () => {
        const payload = buildAccountPayloadWithRouter({
            account: { owner: NFTOKEN_ADDRESS, parsedData: null, parsedProgram: null, rawDataBytes: null },
            kind: 'nftoken',
        });

        expect(payload).toMatchObject({
            entity: { owner_program: NFTOKEN_ADDRESS },
        });
    });
});
