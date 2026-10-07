// @vitest-environment jsdom

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

    it('should return undefined when both SNS and ANS domains are null', () => {
        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBeUndefined();
    });

    it('should return undefined when both SNS and ANS domains are empty arrays', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserANSDomains>);

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBeUndefined();
    });

    it('should return first SNS domain when only SNS domains exist (sorted by name)', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(
            swrStyle([
                { address: 'addr1', name: 'alex.sns' },
                { address: 'addr2', name: 'bob.sns' },
            ]) as ReturnType<typeof useUserSnsDomains>,
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('alex.sns');
    });

    it('should return first ANS domain when SNS domains are empty (sorted by name)', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([
                { address: 'addr1', name: 'alice.abc' },
                { address: 'addr2', name: 'charlie.abc' },
            ]) as ReturnType<typeof useUserANSDomains>,
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('alice.abc');
    });

    it('should prefer SNS domain over ANS when both exist', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(
            swrStyle([{ address: 'addr1', name: 'user.sns' }]) as ReturnType<typeof useUserSnsDomains>,
        );
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([{ address: 'addr2', name: 'user.abc' }]) as ReturnType<typeof useUserANSDomains>,
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('user.sns');
    });

    it('should return ANS domain when SNS is empty and ANS has domains', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        vi.mocked(useUserANSDomains).mockReturnValue(
            swrStyle([{ address: 'addr1', name: 'fallback.abc' }]) as ReturnType<typeof useUserANSDomains>,
        );

        const { result } = renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(result.current).toBe('fallback.abc');
    });

    it('should pass address to SNS hook and disables ANS when SNS is still loading', () => {
        renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(useUserSnsDomains).toHaveBeenCalledWith(VALID_ADDRESS);
        expect(useUserANSDomains).toHaveBeenCalledWith('');
    });

    it('should pass address to ANS hook only when SNS returns empty', () => {
        vi.mocked(useUserSnsDomains).mockReturnValue(swrStyle([]) as ReturnType<typeof useUserSnsDomains>);
        renderHook(() => usePrimaryDomain(VALID_ADDRESS));
        expect(useUserANSDomains).toHaveBeenCalledWith(VALID_ADDRESS);
    });
});
