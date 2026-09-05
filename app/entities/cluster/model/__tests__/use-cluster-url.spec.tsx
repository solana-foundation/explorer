import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { createElement, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '../../lib/cluster';
import { approvedOriginsAtom } from '../approved-origins';
import { customUrlEnabledAtom } from '../custom-url-enabled';
import { useClusterUrl } from '../use-cluster-url';

const DEFAULT_CUSTOM_URL = 'http://localhost:8899';
const WHITELISTED_URL = 'https://rpc.example.com/rpc';
const REMOTE_URL = 'https://my-node.example/rpc';
const NOTHING_TO_CONNECT_TO = 'nothing-to-connect-to';

function renderUseClusterUrl({
    cluster,
    search = '',
    devFlagEnabled = false,
    approvedOrigins,
}: {
    cluster: Cluster;
    search?: string;
    devFlagEnabled?: boolean;
    approvedOrigins?: string[];
}) {
    const store = createStore();
    // Seed before the hook mounts, mirroring state that already existed at page load.
    if (devFlagEnabled) store.set(customUrlEnabledAtom, true);
    if (approvedOrigins) store.set(approvedOriginsAtom, approvedOrigins);
    const onReplaceSearchParams = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store }, children);
    const searchParams = new URLSearchParams(search);
    const { result } = renderHook(() => useClusterUrl({ cluster, onReplaceSearchParams, searchParams }), { wrapper });
    return { onReplaceSearchParams, result, store };
}

// Both stores, not just localStorage: approvals live in sessionStorage, so one test's approved origin
// would otherwise carry into the next and silently honor an endpoint that should still be pending.
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
});
afterEach(() => vi.unstubAllEnvs());

describe('useClusterUrl', () => {
    describe('an endpoint nobody has agreed to', () => {
        it('should hold it pending instead of connecting or stripping', () => {
            // `cluster=custom` says the visitor wants a custom endpoint, not that they trust the one the
            // link supplies. It must not vanish either: the prompt needs the value it is asking about.
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: `cluster=custom&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.pendingCustomUrl?.href).toBe(REMOTE_URL);
            expect(result.current.selection.endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });

        it('should offer nothing to connect to, so no fetch reaches the fallback endpoint', () => {
            // `url` still resolves, because the prompt renders against it.
            const { result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: `cluster=custom&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.connectableUrl).toBeUndefined();
            expect(result.current.url).toBe(DEFAULT_CUSTOM_URL);
        });

        it('should honor an origin approved before this page load', () => {
            // The reload case, which is why approvals live in sessionStorage: the endpoint is still in the
            // address bar after a refresh, so asking again on every one would be the whole friction.
            // Seeded through storage rather than the store, as a page load does.
            sessionStorage.setItem('explorer:approvedRpcOrigins', JSON.stringify(['https://my-node.example']));

            const { result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: `cluster=custom&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(result.current.selection.endpoint?.href).toBe(REMOTE_URL);
            // Settled, so a fetching hook may key on it now.
            expect(result.current.connectableUrl).toBe(REMOTE_URL);
        });

        it('should honor it once its origin is approved', () => {
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                approvedOrigins: ['https://my-node.example'],
                cluster: Cluster.Custom,
                search: `cluster=custom&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(result.current.selection.endpoint?.href).toBe(REMOTE_URL);
            expect(result.current.url).toBe(REMOTE_URL);
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });
    });

    describe('endpoints that need no decision', () => {
        it('should honor a local endpoint on any port', () => {
            // A link pointing at the visitor's own machine reaches nothing the sender can read back.
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: 'cluster=custom&customUrl=http://localhost:8900',
            });

            expect(result.current.selection.endpoint?.href).toBe('http://localhost:8900');
            expect(result.current.url).toBe('http://localhost:8900');
            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });

        it('should honor a whitelisted endpoint', () => {
            // The whitelist is deployment configuration, empty by default, so this case has to set it.
            vi.stubEnv('NEXT_PUBLIC_WHITELISTED_RPCS', 'rpc.example.com');

            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: `cluster=custom&customUrl=${WHITELISTED_URL}`,
            });

            expect(result.current.selection.endpoint?.href).toBe(WHITELISTED_URL);
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });

        it('should honor anything valid under the developer bypass', () => {
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                devFlagEnabled: true,
                search: `cluster=custom&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.selection.endpoint?.href).toBe(REMOTE_URL);
            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });

        it('should read the developer bypass from storage on the very first render', () => {
            // Without `getOnInit` the read lands a render late, so an opted-in developer gets a prompt
            // for their own endpoint on every page load. Seeded through localStorage, as page load does.
            localStorage.setItem('enableCustomUrl', 'true');

            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: `cluster=custom&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.selection.endpoint?.href).toBe(REMOTE_URL);
            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });

        it('should refuse an unusable scheme even under the developer bypass', () => {
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                devFlagEnabled: true,
                search: 'cluster=custom&customUrl=javascript:alert(1)',
            });

            expect(result.current.selection.endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
        });
    });

    describe('params the app has finished with', () => {
        it('should strip an unusable endpoint rather than prompt for it', () => {
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: 'cluster=custom&customUrl=javascript:alert(1)',
            });

            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(result.current.selection.endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
            const stripped = onReplaceSearchParams.mock.calls[0][0] as URLSearchParams;
            expect(stripped.has('customUrl')).toBe(false);
            expect(stripped.get('cluster')).toBe('custom');
        });

        it('should strip it on a non-custom cluster without prompting', () => {
            // `clusterUrl` ignores `customUrl` off Custom, so prompting would ask about an unusable
            // endpoint.
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Devnet,
                search: `cluster=devnet&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.pendingCustomUrl).toBeUndefined();
            expect(result.current.url).not.toContain('my-node.example');
            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
            const stripped = onReplaceSearchParams.mock.calls[0][0] as URLSearchParams;
            expect(stripped.has('customUrl')).toBe(false);
            expect(stripped.get('cluster')).toBe('devnet');
        });

        it('should strip it on a non-custom cluster even under the developer bypass', () => {
            const { onReplaceSearchParams } = renderUseClusterUrl({
                cluster: Cluster.Devnet,
                devFlagEnabled: true,
                search: `cluster=devnet&customUrl=${REMOTE_URL}`,
            });

            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
        });

        it('should strip an empty customUrl param', () => {
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                devFlagEnabled: true,
                search: 'cluster=custom&customUrl=',
            });

            expect(result.current.selection.endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
        });

        it('should fall back to the default endpoint on a bare cluster=custom', () => {
            const { onReplaceSearchParams, result } = renderUseClusterUrl({
                cluster: Cluster.Custom,
                search: 'cluster=custom',
            });

            expect(result.current.selection.endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
            expect(result.current.url).toBe(DEFAULT_CUSTOM_URL);
            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });
    });

    describe('the strip effect', () => {
        function mountWithSearch(initialSearch: string) {
            const store = createStore();
            const onReplaceSearchParams = vi.fn();
            const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store }, children);
            const { rerender } = renderHook(
                ({ search }: { search: string }) =>
                    useClusterUrl({
                        cluster: Cluster.Devnet,
                        onReplaceSearchParams,
                        searchParams: new URLSearchParams(search),
                    }),
                { initialProps: { search: initialSearch }, wrapper },
            );
            return { onReplaceSearchParams, rerender };
        }

        it('should fire for a param introduced by a later navigation', () => {
            const { onReplaceSearchParams, rerender } = mountWithSearch('cluster=devnet');

            expect(onReplaceSearchParams).not.toHaveBeenCalled();

            // The effect depends on searchParams, not just the decision, so a client-side navigation
            // re-introducing the param is caught too.
            rerender({ search: `cluster=devnet&customUrl=${REMOTE_URL}` });

            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
            const stripped = onReplaceSearchParams.mock.calls[0][0] as URLSearchParams;
            expect(stripped.has('customUrl')).toBe(false);
        });

        it('should not loop once the param is gone', () => {
            // Feeding the stripped params back is what the router does once the replace lands.
            const { onReplaceSearchParams, rerender } = mountWithSearch(`cluster=devnet&customUrl=${REMOTE_URL}`);

            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);

            rerender({ search: 'cluster=devnet' });

            expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
        });
    });

    describe('selection identity', () => {
        function mountCustom(search: string) {
            const store = createStore();
            const onReplaceSearchParams = vi.fn();
            const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store }, children);
            return renderHook(
                (props: { search: string }) =>
                    useClusterUrl({
                        cluster: Cluster.Custom,
                        onReplaceSearchParams,
                        // A fresh object per render, which is what next/navigation hands over.
                        searchParams: new URLSearchParams(props.search),
                    }),
                { initialProps: { search }, wrapper },
            );
        }

        it('should hand back the same selection while the cluster and endpoint are unchanged', () => {
            // The selection reaches app-wide context and is a `useCallback` dependency in `receipt-page`,
            // so a new object per render rebuilds every consumer keyed on it. A fresh endpoint would also
            // trip the switcher input's render-phase draft guard and wipe what the user was typing.
            const { rerender, result } = mountCustom('cluster=custom&customUrl=http://localhost:8900');
            const first = result.current.selection;

            rerender({ search: 'cluster=custom&customUrl=http://localhost:8900' });

            expect(result.current.selection).toBe(first);
            expect(result.current.selection.endpoint).toBe(first.endpoint);
        });

        it('should hand back a new selection once the endpoint string changes', () => {
            const { rerender, result } = mountCustom('cluster=custom&customUrl=http://localhost:8900');
            const first = result.current.selection;

            rerender({ search: 'cluster=custom&customUrl=http://localhost:8901' });

            expect(result.current.selection).not.toBe(first);
            expect(result.current.selection.endpoint?.href).toBe('http://localhost:8901');
        });

        it('should keep the default-endpoint selection stable across renders', () => {
            const { rerender, result } = mountCustom('cluster=custom');
            const first = result.current.selection;

            rerender({ search: 'cluster=custom' });

            expect(result.current.selection).toBe(first);
        });

        it('should pair the endpoint only with the Custom cluster', () => {
            // Off Custom there is no endpoint to carry, so nothing downstream asks whether one applies.
            const { result } = renderUseClusterUrl({
                cluster: Cluster.Devnet,
                search: `cluster=devnet&customUrl=${REMOTE_URL}`,
            });

            expect(result.current.selection.cluster).toBe(Cluster.Devnet);
            expect(result.current.selection.endpoint).toBeUndefined();
        });
    });

    describe('the server render and the render that hydrates it', () => {
        // Renders the resolved endpoint, so the assertions read the DOM React hydrates against.
        function EndpointProbe({
            onReplaceSearchParams,
            search,
        }: {
            onReplaceSearchParams: () => void;
            search: string;
        }) {
            const { selection } = useClusterUrl({
                cluster: Cluster.Custom,
                onReplaceSearchParams,
                // A fresh object per render, which is what next/navigation hands over.
                searchParams: new URLSearchParams(search),
            });
            return createElement('span', undefined, selection.endpoint?.href);
        }

        // Renders what a fetching hook would key on.
        function ConnectableProbe({
            onReplaceSearchParams,
            search,
        }: {
            onReplaceSearchParams: () => void;
            search: string;
        }) {
            const { connectableUrl } = useClusterUrl({
                cluster: Cluster.Custom,
                onReplaceSearchParams,
                searchParams: new URLSearchParams(search),
            });
            // A sentinel, not an empty string: the failure to catch is the *fallback* being offered.
            return createElement('span', undefined, connectableUrl ?? NOTHING_TO_CONNECT_TO);
        }

        // Two stores, because that asymmetry is the bug: `getOnInit` has the developer bypass on before
        // the client's first render, and the server never had it.
        function renderThenHydrate(search: string, Probe: typeof EndpointProbe = EndpointProbe) {
            const onReplaceSearchParams = vi.fn();
            const tree = (store: ReturnType<typeof createStore>) =>
                createElement(Provider, { store }, createElement(Probe, { onReplaceSearchParams, search }));

            // eslint-disable-next-line testing-library/render-result-naming-convention -- an HTML string, not a testing-library render result
            const serverMarkup = renderToString(tree(createStore()));

            const clientStore = createStore();
            clientStore.set(customUrlEnabledAtom, true);
            const container = document.createElement('div');
            container.innerHTML = serverMarkup;
            document.body.append(container);
            const onRecoverableError = vi.fn();
            act(() => {
                roots.push(hydrateRoot(container, tree(clientStore), { onRecoverableError }));
            });

            return { container, onRecoverableError, onReplaceSearchParams, serverMarkup };
        }

        const roots: { unmount: () => void }[] = [];
        afterEach(() => {
            while (roots.length > 0) act(() => roots.pop()?.unmount());
        });

        it('should resolve the endpoint the server did, then apply the browser-only decision', () => {
            // The bypass and this tab's approvals live in the browser, so the server cannot reach the
            // same verdict. Deciding anyway while hydrating renders an endpoint the server's HTML does not
            // contain, and React discards the tree — in the navbar, that is the whole cluster button.
            const { container, serverMarkup, onRecoverableError } = renderThenHydrate(
                `cluster=custom&customUrl=${REMOTE_URL}`,
            );

            expect(serverMarkup).toContain(DEFAULT_CUSTOM_URL);
            expect(onRecoverableError).not.toHaveBeenCalled();
            // Deferred, not dropped: the bypass still applies, one render later.
            expect(container.textContent).toBe(REMOTE_URL);
        });

        it('should still decide on the server whatever the server can decide', () => {
            // The wait covers only what the browser holds: an endpoint any reader can rule on for itself
            // is settled in the server render, so the markup names the endpoint the page will use.
            const { container, onRecoverableError, serverMarkup } = renderThenHydrate(
                'cluster=custom&customUrl=http://localhost:8900',
            );

            expect(serverMarkup).toContain('http://localhost:8900');
            expect(onRecoverableError).not.toHaveBeenCalled();
            expect(container.textContent).toBe('http://localhost:8900');
        });

        it('should offer nothing to connect to until the browser has judged the endpoint', () => {
            // While hydrating, neither half of the rule is set, so a guard reading only one lets a
            // fetch through — at the fallback endpoint.
            const { container, onRecoverableError, serverMarkup } = renderThenHydrate(
                `cluster=custom&customUrl=${REMOTE_URL}`,
                ConnectableProbe,
            );

            expect(serverMarkup).toContain(NOTHING_TO_CONNECT_TO);
            // No mismatch, so the hydrating render offered nothing either.
            expect(onRecoverableError).not.toHaveBeenCalled();
            // Deferred, not dropped: the bypass still applies, one render later.
            expect(container.textContent).toBe(REMOTE_URL);
        });

        it('should keep the param it has not judged yet', () => {
            // The strip effect fires on the commit that finishes hydration, so "not judged yet" must not
            // read as "finished with" — the endpoint would be gone before anything could honor it.
            const { onReplaceSearchParams } = renderThenHydrate(`cluster=custom&customUrl=${REMOTE_URL}`);

            expect(onReplaceSearchParams).not.toHaveBeenCalled();
        });
    });

    it('should not persist a param-supplied custom URL', () => {
        renderUseClusterUrl({
            cluster: Cluster.Custom,
            devFlagEnabled: true,
            search: `cluster=custom&customUrl=${REMOTE_URL}`,
        });

        // A persisted copy would outlive the page and be picked up by a later bare `?cluster=custom`.
        expect(localStorage.getItem('explorer:customUrl')).toBeNull();
    });

    it('should not let a stale persisted URL from an older build participate', () => {
        localStorage.setItem('explorer:customUrl', JSON.stringify(WHITELISTED_URL));

        const { result } = renderUseClusterUrl({
            cluster: Cluster.Custom,
            search: `cluster=custom&customUrl=${REMOTE_URL}`,
        });

        expect(result.current.selection.endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
        expect(result.current.pendingCustomUrl?.href).toBe(REMOTE_URL);
    });
});
