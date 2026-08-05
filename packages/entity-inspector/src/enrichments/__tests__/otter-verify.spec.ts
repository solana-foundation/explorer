import type { IdlClient } from '@explorer/idl-decode';
import { describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import {
    notFoundAccountProbe,
    parsedAccountProbe,
    rawAccountProbe,
} from '../../accounts/__tests__/account-fixtures.js';
import { gen } from '../../__tests__/gen.js';
import { fetchOtterVerifyBuildParams, type OtterVerifyDependencies, VERIFY_PROGRAM_ID } from '../otter-verify.js';

const PROGRAM_ADDRESS = gen.bpfUpgradeableLoader;
const SIGNER = gen.systemProgram;
const ACCOUNT_BYTES = new Uint8Array([1, 2, 3, 4]);

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function fakeIdlClient(decodeResult: [unknown, unknown]): IdlClient {
    return { decodeAccountData: vi.fn().mockReturnValue(decodeResult) } as unknown as IdlClient;
}

function createDependencies(overrides: Partial<OtterVerifyDependencies> = {}): OtterVerifyDependencies {
    return {
        fetchAccountInfo: vi
            .fn()
            .mockResolvedValue(rawAccountProbe({ bytes: ACCOUNT_BYTES, owner: VERIFY_PROGRAM_ID })),
        logger: createLoggerMock(),
        resolveIdlClient: vi.fn().mockResolvedValue(fakeIdlClient([undefined, {}])),
        ...overrides,
    };
}

describe('fetchOtterVerifyBuildParams', () => {
    it('should return null when the IDL client cannot be resolved', async () => {
        const dependencies = createDependencies({ resolveIdlClient: vi.fn().mockResolvedValue(null) });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toBeNull();
        expect(dependencies.resolveIdlClient).toHaveBeenCalledWith(VERIFY_PROGRAM_ID, 'mainnet-beta');
        expect(dependencies.fetchAccountInfo).not.toHaveBeenCalled();
    });

    it('should return null when the PDA account does not exist', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(notFoundAccountProbe()),
        });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toBeNull();
    });

    it('should return null when the account data carries no raw bytes', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockResolvedValue(
                parsedAccountProbe({
                    owner: VERIFY_PROGRAM_ID,
                    parsed: { info: {} },
                    program: 'unknown',
                }),
            ),
        });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toBeNull();
    });

    it('should return null when account decoding fails', async () => {
        const dependencies = createDependencies({
            resolveIdlClient: vi.fn().mockResolvedValue(fakeIdlClient([new Error('unknown discriminator'), undefined])),
        });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toBeNull();
    });

    it('should decode build params from the PDA account', async () => {
        const client = fakeIdlClient([
            undefined,
            {
                address: PROGRAM_ADDRESS,
                args: ['--library-name', 42, null, 'vault'],
                commit: 'abc123',
                deploySlot: 12345,
                gitUrl: 'https://github.com/example/repo',
                signer: SIGNER,
                version: '1.0.0',
            },
        ]);
        const dependencies = createDependencies({ resolveIdlClient: vi.fn().mockResolvedValue(client) });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toEqual({
            address: PROGRAM_ADDRESS,
            args: ['--library-name', 'vault'],
            commit: 'abc123',
            deploySlot: 12345,
            gitUrl: 'https://github.com/example/repo',
            signer: SIGNER,
            version: '1.0.0',
        });
        expect(dependencies.fetchAccountInfo).toHaveBeenCalledWith(expect.any(String), 'mainnet-beta', {
            encoding: 'base64',
        });
        expect(client.decodeAccountData).toHaveBeenCalledWith(ACCOUNT_BYTES);
    });

    it('should default missing account fields', async () => {
        const dependencies = createDependencies({
            resolveIdlClient: vi.fn().mockResolvedValue(fakeIdlClient([undefined, { args: 'not-an-array' }])),
        });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toEqual({
            address: '',
            args: [],
            commit: '',
            deploySlot: 0,
            gitUrl: '',
            signer: '',
            version: '',
        });
    });

    it('should coerce a deploy slot above MAX_SAFE_INTEGER through its decimal string', async () => {
        const dependencies = createDependencies({
            resolveIdlClient: vi.fn().mockResolvedValue(fakeIdlClient([undefined, { deploySlot: 9007199254740994n }])),
        });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toMatchObject({ deploySlot: 9007199254740994 });
    });

    it('should warn and return null when the account fetch rejects', async () => {
        const dependencies = createDependencies({
            fetchAccountInfo: vi.fn().mockRejectedValue(new Error('rpc down')),
        });

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, SIGNER, 'mainnet-beta', dependencies),
        ).resolves.toBeNull();
        expect(dependencies.logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] otter verify fetch failed',
            expect.objectContaining({ programAddress: PROGRAM_ADDRESS }),
        );
    });

    it('should warn and return null for an invalid signer address', async () => {
        const dependencies = createDependencies();

        await expect(
            fetchOtterVerifyBuildParams(PROGRAM_ADDRESS, 'not-a-signer', 'mainnet-beta', dependencies),
        ).resolves.toBeNull();
        expect(dependencies.logger.warn).toHaveBeenCalledTimes(1);
        expect(dependencies.fetchAccountInfo).not.toHaveBeenCalled();
    });
});
