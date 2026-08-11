import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pickClusterParams, useBuildClusterPath, useClusterPath } from '../url';

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

        it('should not preserve customUrl param when cluster is not custom', () => {
            const currentParams = new URLSearchParams('customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123');
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

        it('should merge additional params with current params, stripping customUrl when not on custom cluster', () => {
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

        it('should handle multiple params in additional params, stripping customUrl when cluster is not custom', () => {
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

        it('should keep customUrl when the current cluster is custom', () => {
            const currentParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const additionalParams = new URLSearchParams('param=value');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899&param=value');
        });

        it('should keep customUrl when additional params select the custom cluster', () => {
            const additionalParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', undefined, additionalParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should keep customUrl when additional params switch to custom from another cluster', () => {
            const currentParams = new URLSearchParams('cluster=devnet');
            const additionalParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should drop the current customUrl when additional params switch away from custom', () => {
            // The merged cluster decides, not the incoming one — switching custom → devnet must not
            // carry the endpoint into the new URL.
            const currentParams = new URLSearchParams('cluster=custom&customUrl=http://localhost:8899');
            const additionalParams = new URLSearchParams('cluster=devnet');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });
    });

    // The link builder must not be stricter than the reader. `useClusterUrl` honors a `customUrl` on a
    // non-custom cluster in two cases (`isCustomUrlAllowed`); if navigation stripped it anyway, the
    // first in-app click would silently drop the endpoint the page is actually using.
    describe('customUrl allowed on a non-custom cluster', () => {
        it('should keep customUrl on a non-custom cluster when the dev flag is enabled', () => {
            const currentParams = new URLSearchParams('cluster=devnet&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams, undefined, true);
            expect(result).toBe('/address/abc123?cluster=devnet&customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should keep customUrl on the default cluster when the dev flag is enabled', () => {
            // `cluster=mainnet-beta` is dropped as the default, so the merged params carry no cluster at
            // all — the rule must read that as mainnet-beta, not as an unknown cluster.
            const currentParams = new URLSearchParams('cluster=mainnet-beta&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams, undefined, true);
            expect(result).toBe('/address/abc123?customUrl=http%3A%2F%2Flocalhost%3A8899');
        });

        it('should keep a whitelisted customUrl on a non-custom cluster without the dev flag', () => {
            const currentParams = new URLSearchParams('cluster=devnet&customUrl=https://engine.mirror.ad/rpc');
            const result = pickClusterParams('/address/abc123', currentParams);
            expect(result).toBe('/address/abc123?cluster=devnet&customUrl=https%3A%2F%2Fengine.mirror.ad%2Frpc');
        });

        it('should keep an allowed customUrl through an additionalParams merge', () => {
            const currentParams = new URLSearchParams('cluster=devnet&customUrl=http://localhost:8899');
            const additionalParams = new URLSearchParams('sort=fee');
            const result = pickClusterParams('/address/abc123', currentParams, additionalParams, true);
            expect(result).toBe('/address/abc123?cluster=devnet&customUrl=http%3A%2F%2Flocalhost%3A8899&sort=fee');
        });

        it('should still strip customUrl on a non-custom cluster when nothing allows it', () => {
            const currentParams = new URLSearchParams('cluster=devnet&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams, undefined, false);
            expect(result).toBe('/address/abc123?cluster=devnet');
        });

        it('should strip customUrl for an unrecognized cluster slug even with the dev flag', () => {
            const currentParams = new URLSearchParams('cluster=bogus&customUrl=http://localhost:8899');
            const result = pickClusterParams('/address/abc123', currentParams, undefined, true);
            expect(result).toBe('/address/abc123?cluster=bogus');
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

// `pickClusterParams` is tested directly above with an explicit flag. These cover the wiring the
// components rely on: the hook is the only place that reads the persisted toggle, so if it stopped
// reading it, every link would silently fall back to the stripping behavior.
describe('useBuildClusterPath', () => {
    const CUSTOM_ON_DEVNET = 'cluster=devnet&customUrl=http://localhost:8899';

    afterEach(() => {
        localStorage.removeItem('enableCustomUrl');
    });

    function mountBuilder() {
        // A fresh store per test, so the persisted flag cannot leak between cases. `customUrlEnabledAtom`
        // uses `getOnInit`, so it reads localStorage as the store initializes it.
        const store = createStore();
        const { result } = renderHook(() => useBuildClusterPath(), {
            wrapper: ({ children }) => createElement(Provider, { store }, children),
        });
        return result;
    }

    it('should honor customUrl on a non-custom cluster when the persisted flag is set', () => {
        localStorage.setItem('enableCustomUrl', 'true');
        vi.mocked(useSearchParams).mockReturnValue(undefined as any);

        const builder = mountBuilder();

        expect(builder.current('/address/abc123', { currentSearchParams: new URLSearchParams(CUSTOM_ON_DEVNET) })).toBe(
            '/address/abc123?cluster=devnet&customUrl=http%3A%2F%2Flocalhost%3A8899',
        );
    });

    it('should strip customUrl on a non-custom cluster when the flag is unset', () => {
        vi.mocked(useSearchParams).mockReturnValue(undefined as any);

        const builder = mountBuilder();

        expect(builder.current('/address/abc123', { currentSearchParams: new URLSearchParams(CUSTOM_ON_DEVNET) })).toBe(
            '/address/abc123?cluster=devnet',
        );
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
