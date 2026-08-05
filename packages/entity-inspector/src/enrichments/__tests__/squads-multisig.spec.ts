import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import {
    notFoundAccountProbe,
    parsedAccountProbe,
    rawAccountProbe,
} from '../../accounts/__tests__/account-fixtures.js';
import { SQUADS_LAMBDA_URL } from '../../shared/constants.js';
import { squadsV3Idl } from '../idls/squads-v3.js';
import { squadsV4Idl } from '../idls/squads-v4.js';
import type { AccountProbeEnvelope } from '../../rpc/types.js';
import { resolveSquadsMultisigReference } from '../squads-multisig.js';

const { tryCreateIdlClientMock } = vi.hoisted(() => ({
    tryCreateIdlClientMock: vi.fn(),
}));

vi.mock('@explorer/idl-decode', () => ({
    tryCreateIdlClient: tryCreateIdlClientMock,
}));

const AUTHORITY = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';
const MULTISIG_ADDRESS = 'MSIG1111111111111111111111111111111111111111';
const SQUADS_V4_PROGRAM = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
const MAINNET = 'mainnet-beta' as const;
const MULTISIG_BYTES = new Uint8Array([1, 2, 3, 4]);

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createDependencies(
    envelope: AccountProbeEnvelope = rawAccountProbe({ bytes: MULTISIG_BYTES, owner: SQUADS_V4_PROGRAM }),
) {
    return { fetchAccountInfo: vi.fn().mockResolvedValue(envelope), logger: createLoggerMock() };
}

function stubLambdaPayload(payload: unknown): ReturnType<typeof vi.fn> {
    const fetchMock = vi
        .fn()
        .mockResolvedValue({ json: vi.fn().mockResolvedValue(payload), ok: true } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function stubSquadsLambda(version: string, multisig: unknown = MULTISIG_ADDRESS): ReturnType<typeof vi.fn> {
    return stubLambdaPayload({ isSquad: true, multisig, version });
}

function stubDecodedAccount(decoded: Record<string, unknown>): ReturnType<typeof vi.fn> {
    const decodeAccountData = vi.fn().mockReturnValue([undefined, decoded]);
    tryCreateIdlClientMock.mockReturnValue([undefined, { decodeAccountData }]);
    return decodeAccountData;
}

describe('resolveSquadsMultisigReference', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('guard clauses', () => {
        it('should return not_multisig for a null authority', async () => {
            await expect(resolveSquadsMultisigReference(null, MAINNET, createDependencies())).resolves.toEqual({
                status: 'not_multisig',
            });
        });

        it('should return unknown for a non-mainnet cluster', async () => {
            await expect(resolveSquadsMultisigReference(AUTHORITY, 'devnet', createDependencies())).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
        });
    });

    describe('lambda detection', () => {
        it('should return unknown and warn when the lambda fetch rejects', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
            const dependencies = createDependencies();

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, dependencies)).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
            expect(dependencies.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('squads lambda lookup failed'),
                expect.objectContaining({ error: expect.any(Error), upgradeAuthority: AUTHORITY }),
            );
        });

        it('should return unknown when the lambda responds with an HTTP error', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({ json: vi.fn(), ok: false, status: 500 } as unknown as Response),
            );
            const dependencies = createDependencies();

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, dependencies)).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
            expect(dependencies.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('squads lambda lookup failed'),
                expect.objectContaining({
                    error: expect.objectContaining({ message: 'Lambda responded with HTTP 500' }),
                }),
            );
        });

        it('should return unknown when the lambda JSON parsing fails', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
                    ok: true,
                } as unknown as Response),
            );

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
        });

        it('should return not_multisig when the lambda payload is not a record', async () => {
            stubLambdaPayload('not-a-record');

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                status: 'not_multisig',
            });
        });

        it('should return not_multisig when the lambda payload carries an error', async () => {
            stubLambdaPayload({ error: 'not found' });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                status: 'not_multisig',
            });
        });

        it('should return not_multisig when the lambda says the authority is not a squad', async () => {
            stubLambdaPayload({ isSquad: false, multisig: '', version: 'v4' });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                status: 'not_multisig',
            });
        });

        it('should return not_multisig for an unrecognized squads version', async () => {
            stubSquadsLambda('v5');

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                status: 'not_multisig',
            });
        });

        it('should return not_multisig when the lambda multisig address is not a string', async () => {
            stubSquadsLambda('v3', 42);

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                status: 'not_multisig',
            });
        });
    });

    describe('v3 decode', () => {
        it('should return full v3 details from the decoded keys list', async () => {
            const fetchMock = stubSquadsLambda('v3');
            const members = [
                'Pubkey1111111111111111111111111111111111111',
                'Pubkey2222222222222222222222222222222222222',
            ];
            const decodeAccountData = stubDecodedAccount({ keys: members, threshold: 2 });
            const dependencies = createDependencies();

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, dependencies)).resolves.toEqual({
                members,
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: 2,
                version: 'v3',
            });
            expect(fetchMock).toHaveBeenCalledWith(
                `${SQUADS_LAMBDA_URL}/${AUTHORITY}`,
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
            expect(dependencies.fetchAccountInfo).toHaveBeenCalledWith(MULTISIG_ADDRESS, MAINNET, {
                encoding: 'base64',
            });
            expect(tryCreateIdlClientMock.mock.calls[0][0]).toBe(squadsV3Idl);
            expect(decodeAccountData).toHaveBeenCalledWith(MULTISIG_BYTES);
        });

        it('should return null details when the v3 keys list is not an array', async () => {
            stubSquadsLambda('v3');
            stubDecodedAccount({ keys: 'not-an-array', threshold: 2 });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                members: null,
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: null,
                version: 'v3',
            });
        });

        it('should return null details when v3 keys hold no string entries', async () => {
            stubSquadsLambda('v3');
            stubDecodedAccount({ keys: [42, null], threshold: 2 });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                members: null,
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: null,
                version: 'v3',
            });
        });

        it('should return null details when the threshold is missing', async () => {
            stubSquadsLambda('v3');
            stubDecodedAccount({ keys: ['Pubkey1111111111111111111111111111111111111'] });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                members: null,
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: null,
                version: 'v3',
            });
        });

        it('should return null details when the threshold is not positive', async () => {
            stubSquadsLambda('v3');
            stubDecodedAccount({ keys: ['Pubkey1111111111111111111111111111111111111'], threshold: 0 });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                members: null,
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: null,
                version: 'v3',
            });
        });
    });

    describe('v4 decode', () => {
        it('should return full v4 details from the decoded members list', async () => {
            stubSquadsLambda('v4');
            stubDecodedAccount({
                members: [{ key: 'Mem111', permissions: 7 }, { key: 'Mem222' }],
                threshold: 3,
            });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                members: ['Mem111', 'Mem222'],
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: 3,
                version: 'v4',
            });
            expect(tryCreateIdlClientMock.mock.calls[0][0]).toBe(squadsV4Idl);
        });

        it('should filter malformed v4 member entries', async () => {
            stubSquadsLambda('v4');
            stubDecodedAccount({
                members: ['not-a-record', { permissions: 1 }, { key: 'Mem111' }],
                threshold: 1,
            });

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                members: ['Mem111'],
                multisig_address: MULTISIG_ADDRESS,
                status: 'is_multisig',
                threshold: 1,
                version: 'v4',
            });
        });
    });

    describe('account decode failures', () => {
        it('should return unknown and warn when the multisig account is not found', async () => {
            stubSquadsLambda('v4');
            const dependencies = createDependencies(notFoundAccountProbe());

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, dependencies)).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
            expect(dependencies.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('squads multisig resolve failed'),
                expect.objectContaining({ upgradeAuthority: AUTHORITY }),
            );
        });

        it('should return unknown when the account probe has no raw data bytes', async () => {
            stubSquadsLambda('v4');
            const dependencies = createDependencies(
                parsedAccountProbe({ owner: SQUADS_V4_PROGRAM, parsed: { type: 'other' }, program: 'unknown' }),
            );

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, dependencies)).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
        });

        it('should return unknown when the idl client cannot be created', async () => {
            stubSquadsLambda('v3');
            tryCreateIdlClientMock.mockReturnValue([{ code: 42 }, undefined]);

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
        });

        it('should return unknown when account decode fails', async () => {
            stubSquadsLambda('v4');
            const decodeAccountData = vi.fn().mockReturnValue([{ code: 7 }, undefined]);
            tryCreateIdlClientMock.mockReturnValue([undefined, { decodeAccountData }]);

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, createDependencies())).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
        });

        it('should return unknown when fetchAccountInfo rejects', async () => {
            stubSquadsLambda('v3');
            const dependencies = {
                fetchAccountInfo: vi.fn().mockRejectedValue(new Error('RPC timeout')),
                logger: createLoggerMock(),
            };

            await expect(resolveSquadsMultisigReference(AUTHORITY, MAINNET, dependencies)).resolves.toEqual({
                reason: 'source_unavailable',
                status: 'unknown',
            });
        });
    });
});
