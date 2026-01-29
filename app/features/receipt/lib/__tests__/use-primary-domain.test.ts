import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserANSDomains, useUserDomains } from '@/app/entities/domain';

import { usePrimaryDomain } from '../use-primary-domain';

vi.mock('@/app/entities/domain', () => ({ useUserANSDomains: vi.fn(), useUserDomains: vi.fn() }));

const VALID_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const swrStyle = (data: unknown) => ({
    data,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: () => {},
});

describe('usePrimaryDomain', () => {
    beforeEach(() => {
        vi.mocked(useUserDomains).mockReturnValue(swrStyle(undefined) as ReturnType<typeof useUserDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(swrStyle(undefined) as ReturnType<typeof useUserANSDomains>);
    });

    it('returns undefined when both SOL and ANS domains are null', () => {
        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBeUndefined();
    });

    it('returns undefined when both SOL and ANS domains are empty arrays', () => {
        vi.mocked(useUserDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserANSDomains>);

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBeUndefined();
    });

    it('returns first SOL domain when only SOL domains exist (sorted by name)', () => {
        vi.mocked(useUserDomains).mockReturnValue(
            swrStyle([
                { address: {} as never, name: 'alex.sol' },
                { address: {} as never, name: 'bob.sol' },
            ]) as ReturnType<typeof useUserDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('alex.sol');
    });

    it('returns first ANS domain when only ANS domains exist (sorted by name)', () => {
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([
                { address: {} as never, name: 'alice.abc' },
                { address: {} as never, name: 'charlie.abc' },
            ]) as ReturnType<typeof useUserANSDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('alice.abc');
    });

    it('prefers SOL domain over ANS when both exist', () => {
        vi.mocked(useUserDomains).mockReturnValue(
            swrStyle([{ address: {} as never, name: 'user.sol' }]) as ReturnType<typeof useUserDomains>
        );
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([{ address: {} as never, name: 'user.abc' }]) as ReturnType<typeof useUserANSDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('user.sol');
    });

    it('returns ANS domain when SOL is empty and ANS has domains', () => {
        vi.mocked(useUserDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([{ address: {} as never, name: 'fallback.abc' }]) as ReturnType<typeof useUserANSDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('fallback.abc');
    });

    it('passes address through to underlying hooks', () => {
        renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(useUserDomains).toHaveBeenCalledWith(VALID_ADDRESS);
        expect(useUserANSDomains).toHaveBeenCalledWith(VALID_ADDRESS);
    });
});
