import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import { createMultisigResolver } from '../multisig.js';
import { resolveSplMultisigReference } from '../spl-multisig.js';
import { resolveSquadsMultisigReference } from '../squads-multisig.js';

const { resolveSplMultisigReferenceMock, resolveSquadsMultisigReferenceMock } = vi.hoisted(() => ({
    resolveSplMultisigReferenceMock: vi.fn(),
    resolveSquadsMultisigReferenceMock: vi.fn(),
}));

vi.mock('../spl-multisig.js', () => ({
    resolveSplMultisigReference: resolveSplMultisigReferenceMock,
}));

vi.mock('../squads-multisig.js', () => ({
    resolveSquadsMultisigReference: resolveSquadsMultisigReferenceMock,
}));

const AUTHORITY = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';
const MAINNET = 'mainnet-beta' as const;
const DEVNET = 'devnet' as const;

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

function createDependencies() {
    return { fetchAccountInfo: vi.fn(), logger: createLoggerMock() };
}

describe('createMultisigResolver', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return the squads result without calling spl when squads finds a multisig', async () => {
        const squadsHit = {
            members: ['M1', 'M2'],
            multisig_address: 'Msig111',
            status: 'is_multisig' as const,
            threshold: 2,
            version: 'v4' as const,
        };
        resolveSquadsMultisigReferenceMock.mockResolvedValue(squadsHit);
        const dependencies = createDependencies();

        await expect(createMultisigResolver(dependencies)(AUTHORITY, MAINNET)).resolves.toEqual(squadsHit);
        expect(resolveSquadsMultisigReference).toHaveBeenCalledWith(AUTHORITY, MAINNET, dependencies);
        expect(resolveSplMultisigReference).not.toHaveBeenCalled();
    });

    it('should return the squads result for a null authority without calling spl', async () => {
        resolveSquadsMultisigReferenceMock.mockResolvedValue({ status: 'not_multisig' });

        await expect(createMultisigResolver(createDependencies())(null, MAINNET)).resolves.toEqual({
            status: 'not_multisig',
        });
        expect(resolveSplMultisigReference).not.toHaveBeenCalled();
    });

    it('should return squads unknown on mainnet without calling spl', async () => {
        resolveSquadsMultisigReferenceMock.mockResolvedValue({ reason: 'source_unavailable', status: 'unknown' });

        await expect(createMultisigResolver(createDependencies())(AUTHORITY, MAINNET)).resolves.toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
        });
        expect(resolveSplMultisigReference).not.toHaveBeenCalled();
    });

    it('should fall back to spl when squads reports not_multisig', async () => {
        resolveSquadsMultisigReferenceMock.mockResolvedValue({ status: 'not_multisig' });
        const splHit = {
            members: ['S1', 'S2'],
            multisig_address: AUTHORITY,
            status: 'is_multisig' as const,
            threshold: 2,
            version: 'spl-token' as const,
        };
        resolveSplMultisigReferenceMock.mockResolvedValue(splHit);
        const dependencies = createDependencies();

        await expect(createMultisigResolver(dependencies)(AUTHORITY, MAINNET)).resolves.toEqual(splHit);
        expect(resolveSplMultisigReference).toHaveBeenCalledWith(AUTHORITY, MAINNET, dependencies);
    });

    it('should fall back to spl when squads is unknown off mainnet', async () => {
        resolveSquadsMultisigReferenceMock.mockResolvedValue({ reason: 'source_unavailable', status: 'unknown' });
        const splHit = {
            members: ['S1'],
            multisig_address: AUTHORITY,
            status: 'is_multisig' as const,
            threshold: 1,
            version: 'spl-token-2022' as const,
        };
        resolveSplMultisigReferenceMock.mockResolvedValue(splHit);

        await expect(createMultisigResolver(createDependencies())(AUTHORITY, DEVNET)).resolves.toEqual(splHit);
    });

    it('should return spl not_multisig when neither resolver finds a match', async () => {
        resolveSquadsMultisigReferenceMock.mockResolvedValue({ status: 'not_multisig' });
        resolveSplMultisigReferenceMock.mockResolvedValue({ status: 'not_multisig' });

        await expect(createMultisigResolver(createDependencies())(AUTHORITY, MAINNET)).resolves.toEqual({
            status: 'not_multisig',
        });
    });
});
