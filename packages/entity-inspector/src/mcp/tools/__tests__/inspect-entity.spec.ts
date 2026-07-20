import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../../logger.js';
import { asRecord } from '../../../solana/parse-helpers.js';
import { SourceUnavailableError } from '../../../solana/rpc.js';
import { handleInspectEntity, type InspectEntityDependencies, splitBuilderErrors } from '../inspect-entity.js';

const ACCOUNT_IDENTIFIER = '11111111111111111111111111111111';
const TRANSACTION_IDENTIFIER =
    '4ReKprwf3WdLHRrzp4ctPWNBsQDPL3VZz3zMmoZfcGJMJCHh5Vq937mPdyxhCbw54wNnA6hZ7KfNpQdpt13yY7A9';

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createDependencies(overrides: Partial<InspectEntityDependencies> = {}): InspectEntityDependencies {
    return {
        fetchAccountInfo: vi.fn().mockResolvedValue({ value: null }),
        fetchAsset: vi.fn().mockResolvedValue(null),
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

    it('should report transaction identifiers as currently unsupported', async () => {
        const dependencies = createDependencies();

        const result = await handleInspectEntity({ identifier: TRANSACTION_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(true);
        expect(envelope).toEqual({
            errors: [
                {
                    code: 'CURRENTLY_UNSUPPORTED',
                    message: 'transaction inspection is not supported yet',
                },
            ],
            payload: { entity: { kind: 'transaction' } },
        });
        expect(dependencies.fetchAccountInfo).not.toHaveBeenCalled();
        expect(dependencies.fetchAsset).not.toHaveBeenCalled();
    });

    it('should return NOT_FOUND for account probes with explicit null', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue({ value: null }),
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
            fetchAccountInfo: vi.fn().mockResolvedValue({
                value: {
                    data: { parsed: {}, program: 'stake' },
                    executable: false,
                    lamports: 0,
                    owner: 'Stake11111111111111111111111111111111111111',
                },
            }),
            fetchAsset,
        });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);

        expect(result.isError).toBe(false);
        expect(fetchAsset).not.toHaveBeenCalled();
    });

    it('should issue a second RPC probe for upgradeable programData and report the kind unsupported', async () => {
        const executableDataAddress = 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY';
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce({
                value: {
                    data: {
                        parsed: { info: { programData: executableDataAddress }, type: 'program' },
                        program: 'bpf-upgradeable-loader',
                    },
                    executable: true,
                    lamports: 567591537,
                    owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
                },
            })
            .mockResolvedValueOnce({
                value: {
                    data: {
                        parsed: {
                            info: {
                                authority: 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ',
                                data: [btoa(String.fromCharCode(0)), 'base64'],
                                slot: 395847597,
                            },
                            type: 'programData',
                        },
                        program: 'bpf-upgradeable-loader',
                    },
                    executable: false,
                    lamports: 0,
                    owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
                },
            });
        const dependencies = createDependencies({ fetchAccountInfo });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(result.isError).toBe(true);
        expect(fetchAccountInfo).toHaveBeenCalledTimes(2);
        expect(envelope).toEqual({
            errors: [
                {
                    code: 'CURRENTLY_UNSUPPORTED',
                    message: 'bpf-upgradeable-loader accounts are not supported yet',
                },
            ],
            payload: { entity: { kind: 'bpf-upgradeable-loader' } },
        });
    });

    it('should keep the unsupported bpf payload when the second programData probe is unavailable', async () => {
        const fetchAccountInfo = vi
            .fn()
            .mockResolvedValueOnce({
                value: {
                    data: {
                        parsed: {
                            info: { programData: 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY' },
                            type: 'program',
                        },
                        program: 'bpf-upgradeable-loader',
                    },
                    executable: true,
                    lamports: 567591537,
                    owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
                },
            })
            .mockRejectedValueOnce(new SourceUnavailableError('probe timeout'));
        const dependencies = createDependencies({ fetchAccountInfo });

        const result = await handleInspectEntity({ identifier: ACCOUNT_IDENTIFIER }, dependencies);
        const envelope = parseEnvelope(result);

        expect(envelope).toMatchObject({
            errors: [{ code: 'CURRENTLY_UNSUPPORTED' }],
            payload: { entity: { kind: 'bpf-upgradeable-loader' } },
        });
    });

    it('should promote unknown account to compressed-nft via DAS', async () => {
        const fetchAsset = vi.fn().mockResolvedValue({
            compression: { compressed: true, tree: 'tree-id' },
            id: 'asset-id',
            ownership: { owner: 'owner-id' },
        });
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue({
                value: {
                    data: { parsed: { type: 'other' }, program: 'unknown-program' },
                    executable: false,
                    lamports: 0,
                    owner: 'UnknownOwner',
                },
            }),
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
            fetchAccountInfo: vi.fn().mockResolvedValue({
                value: {
                    data: { parsed: { type: 'other' }, program: 'unknown-program' },
                    executable: false,
                    lamports: 0,
                    owner: 'UnknownOwner',
                },
            }),
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

    it('should warn through the console logger by default when DAS lookup fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue({
                value: {
                    data: { parsed: { type: 'other' }, program: 'unknown-program' },
                    executable: false,
                    lamports: 0,
                    owner: 'UnknownOwner',
                },
            }),
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
        const altBytes = btoa(String.fromCharCode(...new Uint8Array(56)));
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue({
                value: {
                    data: [altBytes, 'base64'],
                    executable: false,
                    lamports: 0,
                    owner: 'AddressLookupTab1e1111111111111111111111111',
                },
            }),
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
            fetchAccountInfo: vi.fn().mockResolvedValue({
                value: {
                    data: { parsed: { type: 'mint' }, program: 'spl-token' },
                    executable: false,
                    lamports: 0,
                    owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                },
            }),
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
});
