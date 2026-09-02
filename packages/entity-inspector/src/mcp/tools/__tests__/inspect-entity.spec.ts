import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../../logger.js';
import { gen } from '../../../__tests__/gen.js';
import {
    addressLookupTableRawProbe,
    compressedNftDasAsset,
    legacyLoaderProgramProbe,
    loaderV4StateBytes,
    notFoundAccountProbe,
    parsedAccountProbe,
    rawAccountProbe,
    unknownProgramAccountProbe,
    upgradeableProgramDataProbe,
    upgradeableProgramProbe,
} from '../../../accounts/__tests__/account-fixtures.js';
import { BPF_LOADER_2_PROGRAM_ID, BPF_LOADER_PROGRAM_ID, LOADER_V4_PROGRAM_ID } from '../../../shared/constants.js';
import { asRecord } from '../../../shared/parse-helpers.js';
import { SourceUnavailableError } from '../../../rpc/rpc.js';
import { handleInspectEntity, type InspectEntityDependencies, splitBuilderErrors } from '../inspect-entity.js';

const ACCOUNT_IDENTIFIER = gen.systemProgram;
const TRANSACTION_IDENTIFIER =
    '4ReKprwf3WdLHRrzp4ctPWNBsQDPL3VZz3zMmoZfcGJMJCHh5Vq937mPdyxhCbw54wNnA6hZ7KfNpQdpt13yY7A9';

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function transactionProbe(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        blockTime: 456,
        meta: { computeUnitsConsumed: 99, err: null, fee: 5000 },
        slot: 123,
        transaction: {
            message: {
                accountKeys: ['signer-address', 'program-address'],
                header: {
                    numReadonlySignedAccounts: 0,
                    numReadonlyUnsignedAccounts: 1,
                    numRequiredSignatures: 1,
                },
                instructions: [{ accounts: [0], data: '3Bxs', programIdIndex: 1 }],
                recentBlockhash: 'GHtXQBbU',
            },
        },
        version: 'legacy',
        ...overrides,
    };
}

function createDependencies(overrides: Partial<InspectEntityDependencies> = {}): InspectEntityDependencies {
    return {
        fetchAccountInfo: vi.fn().mockResolvedValue(notFoundAccountProbe()),
        fetchAsset: vi.fn().mockResolvedValue(null),
        fetchSignatureStatus: vi.fn().mockResolvedValue({ value: null }),
        fetchTransaction: vi.fn().mockResolvedValue(transactionProbe()),
        logger: createLoggerMock(),
        ...overrides,
    };
}

function parseEnvelope(result: CallToolResult): Record<string, unknown> {
    const [contentItem] = result.content;
    if (!contentItem || contentItem.type !== 'text') {
        throw new Error('Expected text content envelope.');
    }

    const parsed = asRecord(JSON.parse(contentItem.text));
    if (!parsed) {
        throw new Error('Expected the text envelope to parse into a record.');
    }
    expect(parsed).toEqual(result.structuredContent);
    return parsed;
}

describe('inspect_entity handler', () => {
    it('should return INVALID_ARGUMENT for malformed or oversized input', async () => {
        const resultMalformed = await handleInspectEntity({}, createDependencies());
        const malformedEnvelope = parseEnvelope(resultMalformed);

        expect(resultMalformed.isError).toBe(true);
        expect(malformedEnvelope).toMatchObject({
            errors: [
                {
                    code: 'INVALID_ARGUMENT',
                    message: expect.stringContaining('identifier'),
                },
            ],
        });

        const resultOversized = await handleInspectEntity({ identifier: '1'.repeat(129) }, createDependencies());
        const oversizedEnvelope = parseEnvelope(resultOversized);
        expect(oversizedEnvelope).toMatchObject({
            errors: [{ code: 'INVALID_ARGUMENT' }],
        });
    });

    it('should reject identifiers that do not decode to 32 or 64 bytes', async () => {
        const result = await handleInspectEntity({ identifier: 'abc' }, createDependencies());
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [
                {
                    code: 'INVALID_ARGUMENT',
                    message: 'identifier must decode from base58 to 32 or 64 bytes',
                },
            ],
        });
    });

    it('should reject unsupported cluster values deterministically', async () => {
        const result = await handleInspectEntity(
            { cluster: 'unsupported-cluster', identifier: ACCOUNT_IDENTIFIER },
            createDependencies(),
        );
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [{ code: 'INVALID_ARGUMENT', message: expect.stringContaining('cluster') }],
        });
    });

    it('should build a transaction payload for a found signature', async () => {
        const dependencies = createDependencies({
            fetchSignatureStatus: vi.fn().mockResolvedValue({
                value: { confirmationStatus: 'finalized', confirmations: null },
            }),
        });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    accounts: [
                        { address: 'signer-address', signer: true, source: 'static', writable: true },
                        { address: 'program-address', signer: false, source: 'static', writable: false },
                    ],
                    block_time: 456,
                    confirmation_status: 'finalized',
                    confirmations: 'max',
                    fee_lamports: 5000,
                    instructions: [
                        {
                            accounts: ['signer-address'],
                            data: '3Bxs',
                            inner_instructions: [],
                            program_id: 'program-address',
                            source: 'raw',
                        },
                    ],
                    kind: 'transaction',
                    signature: TRANSACTION_IDENTIFIER,
                    signers: ['signer-address'],
                    slot: 123,
                    status: 'success',
                },
            },
        });
        expect(dependencies.fetchAccountInfo).not.toHaveBeenCalled();
        expect(dependencies.fetchAsset).not.toHaveBeenCalled();
    });

    it('should return NOT_FOUND when the transaction probe is null', async () => {
        const dependencies = createDependencies({
            fetchTransaction: vi.fn().mockResolvedValue(null),
        });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(true);
        expect(envelope).toMatchObject({
            errors: [{ code: 'NOT_FOUND' }],
            payload: { entity: { kind: 'transaction' } },
        });
    });

    it('should tolerate a failing signature status fetch with a non-fatal error and warn', async () => {
        const logger = createLoggerMock();
        const dependencies = createDependencies({
            fetchSignatureStatus: vi.fn().mockRejectedValue(new Error('status unavailable')),
            logger,
        });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] inspect_entity signature status fetch failed',
            expect.objectContaining({ identifier: TRANSACTION_IDENTIFIER }),
        );
        expect(envelope).toMatchObject({
            errors: [{ code: 'INTERNAL_ERROR', message: 'Confirmation status temporarily unavailable.' }],
            payload: { entity: { confirmation_status: null, confirmations: null, kind: 'transaction' } },
        });
    });

    it('should report no errors when the signature status fetch succeeds', async () => {
        const dependencies = createDependencies();

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(envelope).toMatchObject({ errors: [] });
    });

    it('should warn through the console logger by default when the signature status fetch fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const dependencies = createDependencies({
            fetchSignatureStatus: vi.fn().mockRejectedValue(new Error('status unavailable')),
            logger: undefined,
        });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('should route a decodable instruction through the injected fallback', async () => {
        const decodeInstructionFallback = vi.fn().mockReturnValue({
            info: { lamports: 1 },
            program: 'system',
            type: 'transfer',
        });
        const dependencies = createDependencies({ decodeInstructionFallback });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(decodeInstructionFallback).toHaveBeenCalledWith({
            accounts: [{ address: 'signer-address', signer: true, writable: true }],
            data: '3Bxs',
            programId: 'program-address',
        });
        expect(envelope).toMatchObject({
            payload: {
                entity: {
                    instructions: [
                        {
                            decoded: { info: { lamports: 1 }, program: 'system', type: 'transfer' },
                            source: 'bundled',
                        },
                    ],
                },
            },
        });
    });

    it('should map transaction timeout failures to INTERNAL_ERROR with fixed source marker', async () => {
        const dependencies = createDependencies({
            fetchTransaction: vi.fn().mockRejectedValue(new SourceUnavailableError('RPC request timed out.')),
        });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [{ code: 'INTERNAL_ERROR' }],
            payload: {
                entity: {
                    kind: 'transaction',
                    source: {
                        reason: 'source_unavailable',
                        status: 'unknown',
                        value: null,
                    },
                },
            },
        });
    });

    it('should map malformed transaction probes to INTERNAL_ERROR without source marker', async () => {
        const dependencies = createDependencies({
            fetchTransaction: vi.fn().mockResolvedValue(transactionProbe({ slot: BigInt('9007199254740992') })),
        });

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(true);
        expect(envelope).toMatchObject({
            errors: [{ code: 'INTERNAL_ERROR' }],
            payload: {},
        });
    });

    it('should return NOT_FOUND for account probes with explicit null', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(notFoundAccountProbe()),
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [{ code: 'NOT_FOUND' }],
            payload: { entity: { kind: 'account' } },
        });
    });

    it('should map account timeout failures to INTERNAL_ERROR with fixed source marker', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockRejectedValue(new SourceUnavailableError('RPC request timed out.')),
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [{ code: 'INTERNAL_ERROR' }],
            payload: {
                entity: {
                    kind: 'account',
                    source: {
                        reason: 'source_unavailable',
                        status: 'unknown',
                        value: null,
                    },
                },
            },
        });
    });

    it('should map generic fetchAccountInfo errors to INTERNAL_ERROR without source marker', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockRejectedValue(new Error('unexpected')),
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(true);
        expect(envelope).toMatchObject({
            errors: [{ code: 'INTERNAL_ERROR' }],
            payload: {},
        });
    });

    it('should return INTERNAL_ERROR when account probe payload is malformed', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue({ value: undefined }),
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [{ code: 'INTERNAL_ERROR' }],
            payload: {},
        });
    });

    it('should skip DAS lookup when base account kind is already known', async () => {
        const fetchAsset = vi.fn();
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(
                parsedAccountProbe({
                    owner: 'Stake11111111111111111111111111111111111111',
                    parsed: {},
                    program: 'stake',
                }),
            ),
            fetchAsset,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(fetchAsset).not.toHaveBeenCalled();
    });

    it('should build the upgradeable-program payload from the second programData probe', async () => {
        const executableDataAddress = 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY';
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce(upgradeableProgramProbe(executableDataAddress))
            .mockResolvedValueOnce(
                upgradeableProgramDataProbe({
                    authority: 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ',
                    slot: 395847597,
                }),
            );
        const dependencies = createDependencies({ fetchAccountInfo });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(fetchAccountInfo).toHaveBeenCalledTimes(2);
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    executable_data: executableDataAddress,
                    // No discoverProgramIdl injected — the enrichment reports its absence explicitly.
                    idl: { reason: 'source_unavailable', status: 'unknown', value: null },
                    kind: 'bpf-upgradeable-loader',
                    last_deployed_slot: 395847597,
                    upgradeable: true,
                    upgrade_authority: 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ',
                },
            },
        });
    });

    it('should attach the program-IDL discovery to the upgradeable-program payload', async () => {
        const discoverProgramIdl = vi.fn().mockResolvedValue({
            client: null,
            discovery: {
                idl_type: 'anchor',
                program_name: 'My Program',
                source: 'anchor',
                status: 'found',
            },
        });
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce(upgradeableProgramProbe('DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY'))
            .mockResolvedValueOnce(upgradeableProgramDataProbe({ authority: null, slot: 1 }));
        const dependencies = createDependencies({ discoverProgramIdl, fetchAccountInfo });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(discoverProgramIdl).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, 'mainnet-beta');
        expect(envelope).toMatchObject({
            payload: {
                entity: {
                    idl: {
                        idl_type: 'anchor',
                        program_name: 'My Program',
                        source: 'anchor',
                        status: 'found',
                    },
                    kind: 'bpf-upgradeable-loader',
                    upgradeable: false,
                },
            },
        });
    });

    it('should resolve all program enrichments and thread the account context into each resolver', async () => {
        const authority = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';
        const dataBase64 = btoa(String.fromCharCode(1, 2, 3));
        const discoverProgramIdl = vi.fn().mockResolvedValue({
            client: null,
            discovery: { status: 'not_found' },
        });
        const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
        const resolveSecurityMetadata = vi.fn().mockResolvedValue({ status: 'missing' });
        const resolveMultisigReference = vi.fn().mockResolvedValue({ status: 'not_multisig' });
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce(upgradeableProgramProbe('DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY'))
            .mockResolvedValueOnce(upgradeableProgramDataProbe({ authority, dataBase64, slot: 1 }));
        const dependencies = createDependencies({
            discoverProgramIdl,
            fetchAccountInfo,
            resolveMultisigReference,
            resolveProgramVerification,
            resolveSecurityMetadata,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(resolveProgramVerification).toHaveBeenCalledWith(
            ACCOUNT_IDENTIFIER,
            authority,
            dataBase64,
            'mainnet-beta',
        );
        expect(resolveSecurityMetadata).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, dataBase64, 'mainnet-beta');
        expect(resolveMultisigReference).toHaveBeenCalledWith(authority, 'mainnet-beta');
        expect(envelope).toMatchObject({
            payload: {
                entity: {
                    idl: { status: 'not_found' },
                    kind: 'bpf-upgradeable-loader',
                    multisig: { status: 'not_multisig' },
                    security_metadata: { status: 'missing' },
                    verification: { status: 'unverified' },
                },
            },
        });
    });

    const LEGACY_LOADER_CASES = [
        { kind: 'bpf-loader', owner: BPF_LOADER_PROGRAM_ID },
        { kind: 'bpf-loader-2', owner: BPF_LOADER_2_PROGRAM_ID },
    ] as const;
    const V4_AUTHORITY = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';

    it.each(LEGACY_LOADER_CASES)(
        'should resolve $kind enrichments through the frozen path with the program account bytes',
        async ({ kind, owner }) => {
            const bytes = new Uint8Array([1, 2, 3]);
            const dataBase64 = btoa(String.fromCharCode(...bytes));
            const discoverProgramIdl = vi.fn().mockResolvedValue({ client: null, discovery: { status: 'not_found' } });
            const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
            const resolveSecurityMetadata = vi.fn().mockResolvedValue({ status: 'missing' });
            const resolveMultisigReference = vi.fn().mockResolvedValue({ status: 'not_multisig' });
            const fetchAccountInfo = vi.fn().mockResolvedValue(legacyLoaderProgramProbe(owner, bytes));
            const dependencies = createDependencies({
                discoverProgramIdl,
                fetchAccountInfo,
                resolveMultisigReference,
                resolveProgramVerification,
                resolveSecurityMetadata,
            });

            const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
            const envelope = parseEnvelope(result);

            expect(result.isError).toBe(false);
            expect(fetchAccountInfo).toHaveBeenCalledTimes(1);
            expect(discoverProgramIdl).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, 'mainnet-beta');
            expect(resolveProgramVerification).toHaveBeenCalledWith(
                ACCOUNT_IDENTIFIER,
                null,
                dataBase64,
                'mainnet-beta',
            );
            expect(resolveSecurityMetadata).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, dataBase64, 'mainnet-beta');
            expect(resolveMultisigReference).toHaveBeenCalledWith(null, 'mainnet-beta');
            expect(envelope).toMatchObject({
                errors: [],
                payload: {
                    entity: {
                        address: ACCOUNT_IDENTIFIER,
                        executable: true,
                        idl: { status: 'not_found' },
                        kind,
                        multisig: { status: 'not_multisig' },
                        owner_program: owner,
                        security_metadata: { status: 'missing' },
                        verification: { status: 'unverified' },
                    },
                },
            });
        },
    );

    it('should verify a deployed loader-v4 program through the authority path with the sliced ELF', async () => {
        const elf = new Uint8Array([1, 2, 3]);
        const bytes = loaderV4StateBytes({ authority: V4_AUTHORITY, elf, slot: 42, status: 'deployed' });
        const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
        const resolveMultisigReference = vi.fn().mockResolvedValue({ status: 'not_multisig' });
        const fetchAccountInfo = vi.fn().mockResolvedValue(legacyLoaderProgramProbe(LOADER_V4_PROGRAM_ID, bytes));
        const dependencies = createDependencies({
            fetchAccountInfo,
            resolveMultisigReference,
            resolveProgramVerification,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(resolveProgramVerification).toHaveBeenCalledWith(
            ACCOUNT_IDENTIFIER,
            V4_AUTHORITY,
            btoa(String.fromCharCode(...elf)),
            'mainnet-beta',
        );
        expect(resolveMultisigReference).toHaveBeenCalledWith(V4_AUTHORITY, 'mainnet-beta');
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    kind: 'loader-v4',
                    last_state_change_slot: 42,
                    status: 'deployed',
                    upgrade_authority: V4_AUTHORITY,
                    upgradeable: true,
                },
            },
        });
    });

    it('should keep the authority path for a retracted loader-v4 program and scan the full account for security', async () => {
        const elf = new Uint8Array([9, 8, 7]);
        const bytes = loaderV4StateBytes({ authority: V4_AUTHORITY, elf, status: 'retracted' });
        const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
        const resolveSecurityMetadata = vi.fn().mockResolvedValue({ status: 'missing' });
        const fetchAccountInfo = vi.fn().mockResolvedValue(legacyLoaderProgramProbe(LOADER_V4_PROGRAM_ID, bytes));
        const dependencies = createDependencies({
            fetchAccountInfo,
            resolveProgramVerification,
            resolveSecurityMetadata,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(resolveProgramVerification).toHaveBeenCalledWith(
            ACCOUNT_IDENTIFIER,
            V4_AUTHORITY,
            btoa(String.fromCharCode(...elf)),
            'mainnet-beta',
        );
        // Security scans the whole account (header included) — the verification slice must not leak here.
        expect(resolveSecurityMetadata).toHaveBeenCalledWith(
            ACCOUNT_IDENTIFIER,
            btoa(String.fromCharCode(...bytes)),
            'mainnet-beta',
        );
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    kind: 'loader-v4',
                    status: 'retracted',
                    upgrade_authority: V4_AUTHORITY,
                    upgradeable: true,
                },
            },
        });
    });

    it('should pass an empty string, not null, for a loader-v4 program with a zero-length ELF', async () => {
        const bytes = loaderV4StateBytes({ authority: V4_AUTHORITY, elf: new Uint8Array(0), status: 'deployed' });
        const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
        const fetchAccountInfo = vi.fn().mockResolvedValue(legacyLoaderProgramProbe(LOADER_V4_PROGRAM_ID, bytes));
        const dependencies = createDependencies({ fetchAccountInfo, resolveProgramVerification });

        await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        // '' means "authority path over an empty program"; null would reroute to the frozen path.
        expect(resolveProgramVerification).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, V4_AUTHORITY, '', 'mainnet-beta');
    });

    it('should verify a finalized loader-v4 program through the frozen path', async () => {
        const bytes = loaderV4StateBytes({ authority: V4_AUTHORITY, status: 'finalized' });
        const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
        const resolveMultisigReference = vi.fn().mockResolvedValue({ status: 'not_multisig' });
        const fetchAccountInfo = vi.fn().mockResolvedValue(legacyLoaderProgramProbe(LOADER_V4_PROGRAM_ID, bytes));
        const dependencies = createDependencies({
            fetchAccountInfo,
            resolveMultisigReference,
            resolveProgramVerification,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(resolveProgramVerification).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, null, null, 'mainnet-beta');
        expect(resolveMultisigReference).toHaveBeenCalledWith(null, 'mainnet-beta');
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    kind: 'loader-v4',
                    status: 'finalized',
                    upgrade_authority: null,
                    upgradeable: false,
                },
            },
        });
    });

    it('should degrade loader-v4 verification and multisig to undecoded markers instead of the frozen path', async () => {
        const logger = createLoggerMock();
        const discoverProgramIdl = vi.fn().mockResolvedValue({ client: null, discovery: { status: 'not_found' } });
        const resolveProgramVerification = vi.fn();
        const resolveSecurityMetadata = vi.fn().mockResolvedValue({ status: 'missing' });
        const resolveMultisigReference = vi.fn();
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValue(legacyLoaderProgramProbe(LOADER_V4_PROGRAM_ID, new Uint8Array(4)));
        const dependencies = createDependencies({
            discoverProgramIdl,
            fetchAccountInfo,
            logger,
            resolveMultisigReference,
            resolveProgramVerification,
            resolveSecurityMetadata,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(resolveProgramVerification).not.toHaveBeenCalled();
        expect(resolveMultisigReference).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] loader-v4 state undecoded', {
            error: new Error('loader-v4 account data shorter than the state header'),
            identifier: ACCOUNT_IDENTIFIER,
        });
        expect(discoverProgramIdl).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, 'mainnet-beta');
        expect(resolveSecurityMetadata).toHaveBeenCalledTimes(1);
        const undecoded = { reason: 'loader_state_undecoded', status: 'unknown' };
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    kind: 'loader-v4',
                    multisig: undecoded,
                    status: { ...undecoded, value: null },
                    verification: undecoded,
                },
            },
        });
    });

    it('should not resolve program enrichments for non-program account kinds', async () => {
        const discoverProgramIdl = vi.fn();
        const resolveProgramVerification = vi.fn();
        const resolveSecurityMetadata = vi.fn();
        const resolveMultisigReference = vi.fn();
        const fetchAccountInfo = vi.fn().mockResolvedValue(unknownProgramAccountProbe());
        const dependencies = createDependencies({
            discoverProgramIdl,
            fetchAccountInfo,
            resolveMultisigReference,
            resolveProgramVerification,
            resolveSecurityMetadata,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(discoverProgramIdl).not.toHaveBeenCalled();
        expect(resolveProgramVerification).not.toHaveBeenCalled();
        expect(resolveSecurityMetadata).not.toHaveBeenCalled();
        expect(resolveMultisigReference).not.toHaveBeenCalled();
    });

    it('should pass null program bytes to resolvers when a legacy-loader probe carries no base64 data', async () => {
        const resolveProgramVerification = vi.fn().mockResolvedValue({ status: 'unverified' });
        const resolveSecurityMetadata = vi.fn().mockResolvedValue({ status: 'missing' });
        const fetchAccountInfo = vi.fn().mockResolvedValue({
            value: { data: ['zzz', 'base58'], executable: true, lamports: 1, owner: BPF_LOADER_2_PROGRAM_ID },
        });
        const dependencies = createDependencies({
            fetchAccountInfo,
            resolveProgramVerification,
            resolveSecurityMetadata,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(resolveProgramVerification).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, null, null, 'mainnet-beta');
        expect(resolveSecurityMetadata).toHaveBeenCalledWith(ACCOUNT_IDENTIFIER, null, 'mainnet-beta');
    });

    it('should mark legacy-loader enrichments unknown when no resolvers are injected', async () => {
        for (const { kind, owner } of LEGACY_LOADER_CASES) {
            const fetchAccountInfo = vi.fn().mockResolvedValue(legacyLoaderProgramProbe(owner, new Uint8Array(4)));
            const result = await handleInspectEntity(
                { identifier: ACCOUNT_IDENTIFIER },
                createDependencies({ fetchAccountInfo }),
            );
            const envelope = parseEnvelope(result);

            const unknown = { reason: 'source_unavailable', status: 'unknown', value: null };
            expect(envelope).toMatchObject({
                errors: [],
                payload: {
                    entity: {
                        idl: unknown,
                        kind,
                        multisig: unknown,
                        owner_program: owner,
                        security_metadata: unknown,
                        verification: unknown,
                    },
                },
            });
        }
    });

    it('should degrade each rejecting enrichment resolver to unknown without failing the payload', async () => {
        const logger = createLoggerMock();
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce(upgradeableProgramProbe('DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY'))
            .mockResolvedValueOnce(upgradeableProgramDataProbe({ authority: null, slot: 1 }));
        const dependencies = createDependencies({
            discoverProgramIdl: vi.fn().mockRejectedValue(new Error('idl boom')),
            fetchAccountInfo,
            logger,
            resolveMultisigReference: vi.fn().mockRejectedValue(new Error('multisig boom')),
            resolveProgramVerification: vi.fn().mockRejectedValue(new Error('verification boom')),
            resolveSecurityMetadata: vi.fn().mockRejectedValue(new Error('security boom')),
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        const unknown = { reason: 'source_unavailable', status: 'unknown' };
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    idl: unknown,
                    kind: 'bpf-upgradeable-loader',
                    multisig: unknown,
                    security_metadata: unknown,
                    verification: unknown,
                },
            },
        });
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] program idl enrichment failed', {
            error: new Error('idl boom'),
            identifier: ACCOUNT_IDENTIFIER,
        });
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] verification enrichment failed', {
            error: new Error('verification boom'),
            identifier: ACCOUNT_IDENTIFIER,
        });
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] security metadata enrichment failed', {
            error: new Error('security boom'),
            identifier: ACCOUNT_IDENTIFIER,
        });
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] multisig reference enrichment failed', {
            error: new Error('multisig boom'),
            identifier: ACCOUNT_IDENTIFIER,
        });
    });

    it('should mark the upgradeable fields unknown when the programData probe is unavailable', async () => {
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce(upgradeableProgramProbe('DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY'))
            .mockRejectedValueOnce(new SourceUnavailableError('probe timeout'));
        const dependencies = createDependencies({ fetchAccountInfo });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    kind: 'bpf-upgradeable-loader',
                    upgrade_authority: { reason: 'source_unavailable', status: 'unknown', value: null },
                    upgradeable: { reason: 'source_unavailable', status: 'unknown', value: null },
                },
            },
        });
    });

    it('should promote unknown account to compressed-nft via DAS', async () => {
        const fetchAsset = vi.fn().mockResolvedValue(compressedNftDasAsset());
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(unknownProgramAccountProbe()),
            fetchAsset,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(fetchAsset).toHaveBeenCalledTimes(1);
        expect(envelope).toMatchObject({
            errors: [],
            payload: { entity: { kind: 'compressed-nft' } },
        });
    });

    it('should fall back to unknown kind when DAS lookup fails', async () => {
        const logger = createLoggerMock();
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(unknownProgramAccountProbe()),
            fetchAsset: vi.fn().mockRejectedValue(new Error('das unavailable')),
            logger,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] inspect_entity DAS lookup failed',
            expect.objectContaining({ identifier: ACCOUNT_IDENTIFIER }),
        );
        expect(envelope).toMatchObject({
            errors: [],
            payload: { entity: { kind: 'unknown' } },
        });
    });

    it('should decode unknown raw accounts through the owner program IDL', async () => {
        const resolveIdlClient = vi.fn().mockResolvedValue({
            decodeAccountData: vi.fn().mockReturnValue([undefined, { authority: 'abc' }]),
            programName: vi.fn().mockReturnValue('My Program'),
        });
        const dependencies = createDependencies({
            fetchAccountInfo: vi
                .fn()
                .mockResolvedValue(rawAccountProbe({ bytes: new Uint8Array([1, 2, 3]), owner: 'UnknownOwner' })),
            resolveIdlClient,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(resolveIdlClient).toHaveBeenCalledWith('UnknownOwner', 'mainnet-beta');
        expect(envelope).toMatchObject({
            errors: [],
            payload: {
                entity: {
                    decoded: { info: { authority: 'abc' }, program: 'My Program', source: 'idl' },
                    kind: 'unknown',
                },
            },
        });
    });

    it('should omit the program key when the resolved IDL declares no name', async () => {
        const resolveIdlClient = vi.fn().mockResolvedValue({
            decodeAccountData: vi.fn().mockReturnValue([undefined, { authority: 'abc' }]),
            programName: vi.fn().mockReturnValue(undefined),
        });
        const dependencies = createDependencies({
            fetchAccountInfo: vi
                .fn()
                .mockResolvedValue(rawAccountProbe({ bytes: new Uint8Array([1, 2, 3]), owner: 'UnknownOwner' })),
            resolveIdlClient,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);
        const entity = (envelope.payload as { entity: { decoded: Record<string, unknown> } }).entity;

        expect(entity.decoded).toEqual({ info: { authority: 'abc' }, source: 'idl' });
    });

    it('should keep the kind-only unknown payload when no IDL resolves', async () => {
        const resolveIdlClient = vi.fn().mockResolvedValue(null);
        const dependencies = createDependencies({
            fetchAccountInfo: vi
                .fn()
                .mockResolvedValue(rawAccountProbe({ bytes: new Uint8Array([1, 2, 3]), owner: 'UnknownOwner' })),
            resolveIdlClient,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({ payload: { entity: { kind: 'unknown' } } });
        expect((envelope.payload as { entity: Record<string, unknown> }).entity).not.toHaveProperty('decoded');
    });

    it('should keep the kind-only unknown payload when the IDL decode fails', async () => {
        const resolveIdlClient = vi.fn().mockResolvedValue({
            decodeAccountData: vi.fn().mockReturnValue([{ code: 'IDL_ERROR__ACCOUNT_DECODE_FAILED' }, undefined]),
            programName: vi.fn().mockReturnValue('My Program'),
        });
        const dependencies = createDependencies({
            fetchAccountInfo: vi
                .fn()
                .mockResolvedValue(rawAccountProbe({ bytes: new Uint8Array([1, 2, 3]), owner: 'UnknownOwner' })),
            resolveIdlClient,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect((envelope.payload as { entity: Record<string, unknown> }).entity).not.toHaveProperty('decoded');
    });

    it('should skip the IDL decode for unknown accounts without raw bytes', async () => {
        const resolveIdlClient = vi.fn();
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(unknownProgramAccountProbe()),
            resolveIdlClient,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(resolveIdlClient).not.toHaveBeenCalled();
    });

    it('should skip the IDL decode when the probe carries no owner', async () => {
        const resolveIdlClient = vi.fn();
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue({
                // owner deliberately malformed — the normalizer nulls it and the decode guard skips
                value: { data: ['AQID', 'base64'], executable: false, lamports: 1, owner: 123 },
            }),
            resolveIdlClient,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(resolveIdlClient).not.toHaveBeenCalled();
    });

    it('should bind the cluster onto the IDL resolver for the transaction cascade', async () => {
        const resolveIdlClient = vi.fn().mockResolvedValue(null);
        const dependencies = createDependencies({ resolveIdlClient });

        await handleInspectEntity({ cluster: 'devnet', identifier: TRANSACTION_IDENTIFIER }, dependencies);

        expect(resolveIdlClient).toHaveBeenCalledWith('program-address', 'devnet');
    });

    it('should warn through the console logger by default when DAS lookup fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(unknownProgramAccountProbe()),
            fetchAsset: vi.fn().mockRejectedValue(new Error('das unavailable')),
            logger: undefined,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('should classify ALT from raw bytes without DAS lookup', async () => {
        const fetchAsset = vi.fn();
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(addressLookupTableRawProbe()),
            fetchAsset,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(false);
        expect(fetchAsset).not.toHaveBeenCalled();
        expect(envelope).toMatchObject({
            payload: { entity: { kind: 'address-lookup-table' } },
        });
    });

    it('should thread resolveProgramName from dependencies into the payload context', async () => {
        const resolveProgramName = vi.fn().mockReturnValue('Token Program');
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(
                parsedAccountProbe({
                    owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    parsed: { type: 'mint' },
                    program: 'spl-token',
                }),
            ),
            resolveProgramName,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(parseEnvelope(result)).toMatchObject({
            payload: { entity: { kind: 'spl-token:mint' } },
        });
    });
});

describe('splitBuilderErrors', () => {
    it('should pass payloads without builder errors through untouched', () => {
        const payload = { entity: { kind: 'unknown' } };
        expect(splitBuilderErrors(payload)).toEqual({ errors: [], payload });
    });

    it('should lift string errors and drop non-string entries', () => {
        const { errors, payload } = splitBuilderErrors({
            entity: { kind: 'bpf-upgradeable-loader' },
            errors: ['not supported', 42, null],
        });

        expect(errors).toEqual([{ code: 'CURRENTLY_UNSUPPORTED', message: 'not supported' }]);
        expect(payload).toEqual({ entity: { kind: 'bpf-upgradeable-loader' } });
    });

    it('should strip a malformed non-array errors value from the payload', () => {
        expect(
            splitBuilderErrors({
                entity: { kind: 'unknown' },
                errors: 'boom',
            }),
        ).toEqual({ errors: [], payload: { entity: { kind: 'unknown' } } });
    });
});
