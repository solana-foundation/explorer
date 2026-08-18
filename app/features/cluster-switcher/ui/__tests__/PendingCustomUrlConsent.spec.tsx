import { act, fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const REMOTE_URL = 'https://my-node.example/rpc?api-key=secret';

// Hoisted so the module factories below can close over them, and so a test can vary what the provider
// reports without remounting the mock.
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), searchParams: new URLSearchParams() }));
const clusterState = vi.hoisted(() => ({ pendingCustomUrl: undefined as RpcEndpoint | undefined }));

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: nav.push, replace: nav.replace }),
    useSearchParams: () => nav.searchParams,
}));

// Only `useCluster` is replaced — the atoms have to stay real, since approving is what the tests assert on.
vi.mock('@entities/cluster', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/cluster')>()),
    useCluster: () => clusterState,
}));

// Must import after mocks

import { approvedOriginsAtom, type RpcEndpoint, rpcEndpoint } from '@entities/cluster';

import { PendingCustomUrlConsent } from '../PendingCustomUrlConsent';

function renderConsent() {
    const store = createStore();
    return {
        store,
        ...render(
            <Provider store={store}>
                <PendingCustomUrlConsent />
            </Provider>,
        ),
    };
}

describe('PendingCustomUrlConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clusterState.pendingCustomUrl = undefined;
        nav.searchParams = new URLSearchParams(`cluster=custom&customUrl=${REMOTE_URL}&sort=fee`);
    });

    it('should stay out of the way when no endpoint is waiting', () => {
        renderConsent();
        expect(screen.queryByTestId('custom-url-consent')).not.toBeInTheDocument();
    });

    it('should name the host on its own, not buried in the description', () => {
        // A lookalike domain reads as the real thing inside a sentence.
        clusterState.pendingCustomUrl = rpcEndpoint(REMOTE_URL);
        renderConsent();

        expect(screen.getByTestId('consent-host')).toHaveTextContent('my-node.example');
        expect(screen.getByTestId('consent-full-url')).toHaveTextContent(REMOTE_URL);
    });

    it('should sit above the cluster sidebar rather than under its overlay', () => {
        // The sidebar is `z-[1060]` over a `z-[1050]` overlay and the dialog's base is `z-50`, so both its
        // layers have to clear those or the prompt hides behind the switcher.
        clusterState.pendingCustomUrl = rpcEndpoint(REMOTE_URL);
        renderConsent();

        const content = screen.getByTestId('custom-url-consent');
        expect(Number(content.style.zIndex)).toBeGreaterThan(1060);
        // Radix portals both layers into <body>, overlay immediately before the content. The overlay is
        // decorative — no role, no accessible name — so no Testing Library query reaches it.
        // eslint-disable-next-line testing-library/no-node-access -- see above
        const overlay = content.previousElementSibling as HTMLElement;
        expect(overlay.className).toContain('inset-0');
        expect(Number(overlay.style.zIndex)).toBeGreaterThan(1060);
    });

    it('should approve the origin, not the full URL, on confirm', () => {
        clusterState.pendingCustomUrl = rpcEndpoint(REMOTE_URL);
        const { store } = renderConsent();

        fireEvent.click(screen.getByTestId('consent-confirm'));

        // Origin, so a rotated key or a different path on the same server does not ask again.
        expect(store.get(approvedOriginsAtom)).toEqual(['https://my-node.example']);
        expect(nav.replace).not.toHaveBeenCalled();
    });

    it('should drop the endpoint and fall back to the default cluster on cancel', () => {
        clusterState.pendingCustomUrl = rpcEndpoint(REMOTE_URL);
        const { store } = renderConsent();

        fireEvent.click(screen.getByTestId('consent-cancel'));

        expect(store.get(approvedOriginsAtom)).toEqual([]);
        // `replace`, so a refused prompt does not sit in the back history waiting to ask again.
        expect(nav.replace).toHaveBeenCalledWith('/?sort=fee');
        expect(nav.push).not.toHaveBeenCalled();
    });

    it('should ignore a click on the backdrop', async () => {
        // A security question needs an answer, and a stray click outside is not one. Only Escape, the X and
        // Cancel dismiss it.
        clusterState.pendingCustomUrl = rpcEndpoint(REMOTE_URL);
        renderConsent();

        // Radix attaches its outside-pointerdown listener from a `setTimeout`, so the click has to wait a
        // tick. Fired sooner, nothing is listening and the assertions below hold for the wrong reason.
        await act(() => new Promise(resolve => setTimeout(resolve, 0)));
        fireEvent.pointerDown(document.body);

        expect(screen.getByTestId('custom-url-consent')).toBeInTheDocument();
        expect(nav.replace).not.toHaveBeenCalled();
    });

    it('should treat dismissal as a decline', () => {
        // The safe outcome has to be the default one.
        clusterState.pendingCustomUrl = rpcEndpoint(REMOTE_URL);
        const { store } = renderConsent();

        fireEvent.keyDown(document.body, { key: 'Escape' });

        expect(store.get(approvedOriginsAtom)).toEqual([]);
        expect(nav.replace).toHaveBeenCalledWith('/?sort=fee');
    });
});
