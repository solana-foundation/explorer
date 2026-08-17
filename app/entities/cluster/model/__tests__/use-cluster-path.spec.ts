import { renderHook } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import { pickClusterParams, useBuildClusterPath, useClusterPath } from '../use-cluster-path';

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

        it('should not preserve customUrl when the cluster is not custom', () => {
            // The param is inert off Custom, and the reader strips it on arrival. An absent cluster param
            // means the default cluster.
            const currentParams = new URLSearchParams('customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123');
        });

        it('should preserve both cluster and customUrl on the custom cluster', () => {
            const currentParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should preserve a customUrl the user has not approved yet', () => {
            // Trust is not the builder's question: an endpoint awaiting consent has to survive an in-app
            // click, or the prompt loses the value it is asking about.
            const currentParams = new URLSearchParams('cluster=custom&customUrl=https://attacker.rpc/rpc');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=https%3A%2F%2Fattacker.rpc%2Frpc');
        });

        it('should encode an endpoint that carries its own query string', () => {
            // The `?` and `&` inside the endpoint must survive as data, or the receiving page reads
            // `api-key` as a param of its own and the endpoint arrives truncated.
            const currentParams = new URLSearchParams('cluster=custom&customUrl=https://my-node.example/rpc?api-key=k');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe(
                '/address/abc123?cluster=custom&customUrl=https%3A%2F%2Fmy-node.example%2Frpc%3Fapi-key%3Dk',
            );
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

        it('should merge additional params with current params, stripping a customUrl nothing allows', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('customUrl=http://test.com');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });

        it('should prioritize additional params over current params for cluster', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('cluster=testnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet');
        });

        it('should handle multiple params in additional params, stripping a customUrl nothing allows', () => {
            const additionalParams = new URLSearchParams('cluster=testnet&customUrl=http://test.com');
            const result = pickClusterParams('/address/abc123', undefined, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet');
        });

        it('should prioritize additional params over current params for cluster, but keep other search params', () => {
            const currentParams = new URLSearchParams('cluster=devnet&param=value');
            const additionalParams = new URLSearchParams('cluster=testnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=testnet&param=value');
        });

        it('should keep a customUrl on the custom cluster through a merge', () => {
            const currentParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const additionalParams = new URLSearchParams('param=value');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899&param=value');
        });

        it('should keep a customUrl the additional params introduce alongside the custom cluster', () => {
            const additionalParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', undefined, additionalParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should keep a customUrl when additional params switch to the custom cluster', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should drop the current customUrl when additional params switch away from custom', () => {
            // Switching custom → devnet must not carry the endpoint into a URL that ignores it.
            const currentParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const additionalParams = new URLSearchParams('cluster=devnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });
    });

    // The builder must never be *stricter* than the reader, or the first in-app click drops the endpoint
    // the page is using. Looser is necessary — see the pending case above.
    describe('relative to what the reader honors', () => {
        it('should drop an unusable customUrl even on the custom cluster', () => {
            for (const candidate of ['javascript:alert(1)', 'not a url', 'ws://rpc.example.com']) {
                const currentParams = new URLSearchParams();
                currentParams.set('cluster', 'custom');
                currentParams.set('customUrl', candidate);
                expect(pickClusterParams('/address/abc123', currentParams)).toBe('/address/abc123?cluster=custom');
            }
        });

        it('should drop customUrl for an unrecognized cluster slug', () => {
            // `parseQuery` maps an unknown slug to the default cluster, so the reader strips it there too.
            const currentParams = new URLSearchParams('cluster=bogus&customUrl=http://localhost:8899');
            expect(pickClusterParams('/address/abc123', currentParams)).toBe('/address/abc123?cluster=bogus');
        });

        it('should drop customUrl on the default cluster', () => {
            const currentParams = new URLSearchParams('cluster=mainnet-beta&customUrl=http://localhost:8899');
            expect(pickClusterParams('/address/abc123', currentParams)).toBe('/address/abc123');
        });

        it('should keep a whitelisted customUrl on the custom cluster', () => {
            const currentParams = new URLSearchParams('cluster=custom&customUrl=https://rpc.example.com/rpc');
            expect(pickClusterParams('/address/abc123', currentParams)).toBe(
                '/address/abc123?cluster=custom&customUrl=https%3A%2F%2Frpc.example.com%2Frpc',
            );
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

        it('should not preserve customUrl when cluster is mainnet-beta', () => {
            const currentParams = new URLSearchParams('cluster=mainnet-beta&customUrl=http://test.com');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123');
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

        it('should handle additional params with hash, stripping customUrl when not on custom cluster', () => {
            vi.mocked(useSearchParams).mockReturnValue(mockUseSearchParams({ cluster: 'devnet' }) as any);

            const additionalParams = new URLSearchParams('customUrl=http://test.com');
            const { result } = renderHook(() =>
                useClusterPath({ additionalParams, pathname: '/address/abc123#tokens' }),
            );

            expect(result.current).toBe('/address/abc123?cluster=devnet#tokens');
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

// These cover the wiring the components rely on, notably the `currentSearchParams` override: search
// navigation builds paths from params that were never in the URL bar, so the strip effect never saw them.
describe('useBuildClusterPath', () => {
    function mountBuilder() {
        const { result } = renderHook(() => useBuildClusterPath());
        return result;
    }

    it('should decide from the override params, not the live URL', () => {
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('cluster=custom') as any);

        const builder = mountBuilder();

        // The override says devnet, so the endpoint is inert. The live `cluster=custom` must not rescue it.
        expect(
            builder.current('/address/abc123', {
                currentSearchParams: new URLSearchParams('cluster=devnet&customUrl=http://localhost:8899'),
            }),
        ).toBe('/address/abc123?cluster=devnet');
    });

    it('should carry a custom-cluster endpoint through the override params', () => {
        vi.mocked(useSearchParams).mockReturnValue(undefined as any);

        const builder = mountBuilder();

        expect(
            builder.current('/address/abc123', {
                currentSearchParams: new URLSearchParams('cluster=custom&customUrl=http://localhost:8899'),
            }),
        ).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
    });

    it('should fall back to the live search params when no override is given', () => {
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('cluster=testnet') as any);

        const builder = mountBuilder();

        expect(builder.current('/address/abc123')).toBe('/address/abc123?cluster=testnet');
    });

    it('should keep the hash fragment after the query string', () => {
        vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('cluster=testnet') as any);

        const builder = mountBuilder();

        expect(builder.current('/address/abc123#tokens')).toBe('/address/abc123?cluster=testnet#tokens');
    });
});
