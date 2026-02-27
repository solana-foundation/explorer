import { useUserANSDomains, useUserSnsDomains } from '@entities/domain';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePrimaryDomain } from '../use-primary-domain';

vi.mock('@entities/domain', () => ({ useUserANSDomains: vi.fn(), useUserSnsDomains: vi.fn() }));

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
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle(undefined) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(swrStyle(undefined) as ReturnType<typeof useUserANSDomains>);
    });

    it('returns undefined when both SOL and ANS domains are null', () => {
        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBeUndefined();
    });

    it('returns undefined when both SOL and ANS domains are empty arrays', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserANSDomains>);

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBeUndefined();
    });

    it('returns first SOL domain when only SOL domains exist (sorted by name)', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(
            swrStyle([
                { address: 'addr1', name: 'alex.sol' },
                { address: 'addr2', name: 'bob.sol' },
            ]) as ReturnType<typeof useUserSnsDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('alex.sol');
    });

    it('returns first ANS domain when SNS domains are empty (sorted by name)', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([
                { address: 'addr1', name: 'alice.abc' },
                { address: 'addr2', name: 'charlie.abc' },
            ]) as ReturnType<typeof useUserANSDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('alice.abc');
    });

    it('prefers SOL domain over ANS when both exist', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(
            swrStyle([{ address: 'addr1', name: 'user.sol' }]) as ReturnType<typeof useUserSnsDomains>
        );
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([{ address: 'addr2', name: 'user.abc' }]) as ReturnType<typeof useUserANSDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('user.sol');
    });

    it('returns ANS domain when SOL is empty and ANS has domains', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([{ address: 'addr1', name: 'fallback.abc' }]) as ReturnType<typeof useUserANSDomains>
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('fallback.abc');
    });

    it('passes address to SNS hook and disables ANS when SNS is still loading', () => {
        renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(useUserSnsDomains).toHaveBeenCalledWith(VALID_ADDRESS);
        expect(useUserANSDomains).toHaveBeenCalledWith('');
    });

    it('passes address to ANS hook only when SNS returns empty', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(useUserANSDomains).toHaveBeenCalledWith(VALID_ADDRESS);
    });
});
