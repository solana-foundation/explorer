import { describe, expect, it, vi } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import type { InspectorLogger } from '../../logger.js';
import { notFoundAccountProbe, parsedAccountProbe } from '../../accounts/__tests__/account-fixtures.js';
import type { AccountProbeEnvelope } from '../../rpc/types.js';
import { resolveSplMultisigReference } from '../spl-multisig.js';

const ADDRESS = 'SplMultisig111111111111111111111111111111111';
const CLUSTER = 'mainnet-beta' as const;
const TOKEN_PROGRAM = gen.tokenProgram;

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createDependencies(envelope: AccountProbeEnvelope) {
    return { fetchAccountInfo: vi.fn().mockResolvedValue(envelope), logger: createLoggerMock() };
}

function multisigProbe(program: string, parsed: unknown): AccountProbeEnvelope {
    return parsedAccountProbe({ owner: TOKEN_PROGRAM, parsed, program });
}

describe('resolveSplMultisigReference', () => {
    it('should return not_multisig when the account does not exist', async () => {
        const dependencies = createDependencies(notFoundAccountProbe());

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            status: 'not_multisig',
        });
        expect(dependencies.fetchAccountInfo).toHaveBeenCalledWith(ADDRESS, CLUSTER);
    });

    it('should return not_multisig when the parsed program is not an spl token program', async () => {
        const dependencies = createDependencies(
            multisigProbe('bpf-upgradeable-loader', { info: {}, type: 'multisig' }),
        );

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            status: 'not_multisig',
        });
    });

    it('should return not_multisig when the parsed data is not a record', async () => {
        const dependencies = createDependencies(multisigProbe('spl-token', 'not-a-record'));

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            status: 'not_multisig',
        });
    });

    it('should return not_multisig when the parsed type is not multisig', async () => {
        const dependencies = createDependencies(multisigProbe('spl-token', { info: {}, type: 'mint' }));

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            status: 'not_multisig',
        });
    });

    it('should return full spl-token multisig details', async () => {
        const signers = [
            'Signer1111111111111111111111111111111111111',
            'Signer2222222222222222222222222222222222222',
            'Signer3333333333333333333333333333333333333',
        ];
        const dependencies = createDependencies(
            multisigProbe('spl-token', {
                info: { isInitialized: true, numRequiredSigners: 2, numValidSigners: 3, signers },
                type: 'multisig',
            }),
        );

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            members: signers,
            multisig_address: ADDRESS,
            status: 'is_multisig',
            threshold: 2,
            version: 'spl-token',
        });
    });

    it('should return full spl-token-2022 multisig details', async () => {
        const signers = ['Mem111', 'Mem222'];
        const dependencies = createDependencies(
            multisigProbe('spl-token-2022', {
                info: { isInitialized: true, numRequiredSigners: 1, numValidSigners: 2, signers },
                type: 'multisig',
            }),
        );

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            members: signers,
            multisig_address: ADDRESS,
            status: 'is_multisig',
            threshold: 1,
            version: 'spl-token-2022',
        });
    });

    it('should filter non-string signer entries', async () => {
        const dependencies = createDependencies(
            multisigProbe('spl-token', {
                info: { numRequiredSigners: 2, signers: ['Mem111', 42, null, { nested: true }, 'Mem222'] },
                type: 'multisig',
            }),
        );

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toMatchObject({
            members: ['Mem111', 'Mem222'],
            status: 'is_multisig',
        });
    });

    it('should return null threshold and members when parsed info fields are missing', async () => {
        const dependencies = createDependencies(multisigProbe('spl-token', { info: {}, type: 'multisig' }));

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            members: null,
            multisig_address: ADDRESS,
            status: 'is_multisig',
            threshold: null,
            version: 'spl-token',
        });
    });

    it('should return null details when parsed info is missing entirely', async () => {
        const dependencies = createDependencies(multisigProbe('spl-token', { type: 'multisig' }));

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            members: null,
            multisig_address: ADDRESS,
            status: 'is_multisig',
            threshold: null,
            version: 'spl-token',
        });
    });

    it('should return null members when signers is not an array', async () => {
        const dependencies = createDependencies(
            multisigProbe('spl-token', { info: { numRequiredSigners: 2, signers: 'not-an-array' }, type: 'multisig' }),
        );

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toMatchObject({
            members: null,
            threshold: 2,
        });
    });

    it('should return empty members when the signers list is empty', async () => {
        const dependencies = createDependencies(
            multisigProbe('spl-token', {
                info: { isInitialized: true, numRequiredSigners: 0, numValidSigners: 0, signers: [] },
                type: 'multisig',
            }),
        );

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            members: [],
            multisig_address: ADDRESS,
            status: 'is_multisig',
            threshold: 0,
            version: 'spl-token',
        });
    });

    it('should return unknown and warn when fetchAccountInfo rejects', async () => {
        const logger = createLoggerMock();
        const dependencies = { fetchAccountInfo: vi.fn().mockRejectedValue(new Error('RPC timeout')), logger };

        await expect(resolveSplMultisigReference(ADDRESS, CLUSTER, dependencies)).resolves.toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
        });
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('spl multisig resolve failed'),
            expect.objectContaining({ address: ADDRESS }),
        );
    });
});
