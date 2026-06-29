import type { FormattedIdl, SupportedIdl } from '@entities/idl';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createIdlAnalytics } from '../../interactive-idl/lib/analytics';
import { useTabs } from '../use-tabs';

vi.mock('@utils/env', () => ({
    isEnvEnabled: () => true,
}));

vi.mock('../../interactive-idl/lib/analytics', () => ({
    createIdlAnalytics: vi.fn(() => ({
        trackSectionsExpanded: vi.fn(),
        trackTabOpened: vi.fn(),
        trackTransactionConfirmed: vi.fn(),
        trackTransactionFailed: vi.fn(),
        trackTransactionSubmitted: vi.fn(),
        trackWalletConnected: vi.fn(),
    })),
}));

vi.mock('@entities/idl', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/idl')>();
    return {
        ...actual,
        getIdlStandard: (idl: { __standard: 'Anchor' | 'Codama' }) => idl.__standard,
        isIdlProgramIdMismatch: () => false,
        isInteractiveIdlSupported: () => true,
    };
});

const formattedIdl = { instructions: [{ name: 'foo' }] } as unknown as FormattedIdl;

describe('useTabs interactive analytics wiring', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create an Anchor-scoped tracker for Anchor IDLs', () => {
        const originalIdl = { __standard: 'Anchor' } as unknown as SupportedIdl;
        renderHook(() => useTabs(formattedIdl, originalIdl, 'prog1'));
        expect(createIdlAnalytics).toHaveBeenCalledWith('Anchor');
    });

    it('should create a Codama-scoped tracker for Codama IDLs', () => {
        const originalIdl = { __standard: 'Codama' } as unknown as SupportedIdl;
        renderHook(() => useTabs(formattedIdl, originalIdl, 'prog1'));
        expect(createIdlAnalytics).toHaveBeenCalledWith('Codama');
    });
});
