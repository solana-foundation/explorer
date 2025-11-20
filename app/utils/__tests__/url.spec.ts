import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import { pickClusterParams, useClusterPath } from '../url';

vi.mock('next/navigation');

describe('pickClusterParams', () => {
    describe('with no search params', () => {
        it('should return pathname only', () => {
            const result = pickClusterParams('/address/abc123');
            expect(result).toBe('/address/abc123');
        });

        it('should handle root pathname', () => {
            const result = pickClusterParams('/');
            expect(result).toBe('/');
        });
    });

    describe('with current search params', () => {
        it('should preserve cluster param from current search', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });

        it('should preserve customUrl param from current search', () => {
            const currentParams = new URLSearchParams('customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should preserve both cluster and customUrl params', () => {
            const currentParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should ignore non-cluster params from current search', () => {
            const currentParams = new URLSearchParams('cluster=devnet&foo=bar&baz=qux');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });

        it('should handle empty current search params', () => {
            const currentParams = new URLSearchParams('');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123');
        });
    });

    describe('with additional params', () => {
        it('should add additional params', () => {
            const additionalParams = new URLSearchParams('cluster=testnet');
            const result = pickClusterParams('/address/abc123', undefined, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet');
        });

        it('should merge additional params with current params', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('customUrl=http://test.com');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=devnet&customUrl=http%3A%2F%2Ftest.com');
        });

        it('should prioritize additional params over current params for cluster', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('cluster=testnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet');
        });

        it('should handle multiple params in additional params', () => {
            const additionalParams = new URLSearchParams('cluster=testnet&customUrl=http://test.com');
            const result = pickClusterParams('/address/abc123', undefined, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet&customUrl=http%3A%2F%2Ftest.com');
        });

        it('should prioritize additional params over current params for cluster, but keep other search params', () => {
            const currentParams = new URLSearchParams('cluster=devnet&param=value');
            const additionalParams = new URLSearchParams('cluster=testnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet&param=value');
        });
    });

    describe('edge cases', () => {
        it('should handle pathname with trailing slash', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const result = pickClusterParams('/address/abc123/', currentParams);
            expect(result).toBe('/address/abc123/?cluster=devnet');
        });

        it('should handle complex pathname', () => {
            const currentParams = new URLSearchParams('cluster=mainnet-beta');
            const result = pickClusterParams('/address/abc123/tokens', currentParams);
            expect(result).toBe('/address/abc123/tokens');
        });

        it('should handle undefined current params', () => {
            const result = pickClusterParams('/address/abc123', undefined);
            expect(result).toBe('/address/abc123');
        });
    });

    describe('mainnet-beta filtering', () => {
        it('should not include mainnet-beta cluster in URL', () => {
            const currentParams = new URLSearchParams('cluster=mainnet-beta');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123');
        });

        it('should filter mainnet-beta from additional params', () => {
            const additionalParams = new URLSearchParams('cluster=mainnet-beta');
            const result = pickClusterParams('/address/abc123', undefined, additionalParams);
            expect(result).toBe('/address/abc123');
        });

        it('should remove cluster param when switching to mainnet-beta', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('cluster=mainnet-beta');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123');
        });

        it('should preserve customUrl when cluster is mainnet-beta', () => {
            const currentParams = new URLSearchParams('cluster=mainnet-beta&customUrl=http://test.com');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?customUrl=http%3A%2F%2Ftest.com');
        });

        it('should switch from mainnet-beta to other cluster correctly', () => {
            const currentParams = new URLSearchParams('cluster=mainnet-beta');
            const additionalParams = new URLSearchParams('cluster=devnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });
    });
});

describe('useClusterPath', () => {
    const mockUseSearchParams = (params: Record<string, string | null> = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null) {
                searchParams.set(key, value);
            }
        });

        return {
            get: (key: string) => searchParams.get(key),
            has: (key: string) => searchParams.has(key),
            toString: () => searchParams.toString(),
        };
    };

    describe('integration with pickClusterParams', () => {
        it('should integrate with pickClusterParams for basic functionality', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams({ cluster: 'devnet' }) as any);

            const { result } = renderHook(() => useClusterPath({ pathname: '/address/abc123' }));

            expect(result.current).toBe('/address/abc123?cluster=devnet');
        });

        it('should handle additional params override', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams({ cluster: 'devnet' }) as any);

            const additionalParams = new URLSearchParams('cluster=testnet');
            const { result } = renderHook(() => useClusterPath({ additionalParams, pathname: '/address/abc123' }));

            expect(result.current).toBe('/address/abc123?cluster=testnet');
        });
    });

    describe('hash fragment handling', () => {
        it('should preserve hash fragment', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams() as any);

            const { result } = renderHook(() => useClusterPath({ pathname: '/address/abc123#history' }));

            expect(result.current).toBe('/address/abc123#history');
        });

        it('should preserve hash with cluster param', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams({ cluster: 'devnet' }) as any);

            const { result } = renderHook(() => useClusterPath({ pathname: '/address/abc123#history' }));

            expect(result.current).toBe('/address/abc123?cluster=devnet#history');
        });

        it('should handle multiple hash-like characters correctly', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams({ cluster: 'testnet' }) as any);

            const { result } = renderHook(() => useClusterPath({ pathname: '/address/abc#def#ghi' }));

            expect(result.current).toBe('/address/abc?cluster=testnet#def#ghi');
        });

        it('should handle additional params with hash', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams({ cluster: 'devnet' }) as any);

            const additionalParams = new URLSearchParams('customUrl=http://test.com');
            const { result } = renderHook(() =>
                useClusterPath({ additionalParams, pathname: '/address/abc123#tokens' })
            );

            expect(result.current).toBe('/address/abc123?cluster=devnet&customUrl=http%3A%2F%2Ftest.com#tokens');
        });
    });

    describe('null or undefined search params', () => {
        it('should handle null useSearchParams return', () => {
            vi.mocked(useSearchParams).mockReturnValue(null as any);

            const { result } = renderHook(() => useClusterPath({ pathname: '/address/abc123' }));

            expect(result.current).toBe('/address/abc123');
        });

        it('should handle undefined useSearchParams return', () => {
            vi.mocked(useSearchParams).mockReturnValue(undefined as any);

            const { result } = renderHook(() => useClusterPath({ pathname: '/address/abc123' }));

            expect(result.current).toBe('/address/abc123');
        });
    });
});
