import { act, fireEvent, render, screen } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SavedCluster, savedClustersAtom } from '../../lib/cluster-storage';

// Deliberately not `DEFAULT_CUSTOM_URL`: the save control hides on the default, so every save test
// written against it would be testing the wrong thing.
const CUSTOM_URL = 'http://my-validator:8899';

// Hoisted so the module factory below can close over it.
const nav = vi.hoisted(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: nav.push, replace: nav.replace }),
    useSearchParams: () => nav.searchParams,
}));

// Mutable so a test can simulate the resolved endpoint catching up with a navigation the input triggered.
// Held as a string and parsed on read, the direction the real provider works in. `CUSTOM_URL` is spelled
// out again because `vi.hoisted` lifts this above the const, into its temporal dead zone.
const clusterMock = vi.hoisted(() => ({ customUrl: 'http://my-validator:8899' }));

// Spread the real barrel so `approvedOriginsAtom` and `clusterSelection` stay live. Only the connection
// hook and the modal's visibility are stubbed; `useClusterModal` returning `true` keeps it open.
vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return {
        ...actual,
        useCluster: () => ({
            ...actual.clusterSelection(Cluster.Custom, clusterMock.customUrl),
            status: ClusterStatus.Connected,
        }),
        useClusterModal: () => [true, vi.fn()],
    };
});

// Relative to this file, so it reaches up out of __tests__. A wrong path leaves the mock inert silently.
vi.mock('../ClusterModalDeveloperSettings', () => ({
    ClusterModalDeveloperSettings: () => null,
}));

// Must import after mocks

import { approvedOriginsAtom, DEFAULT_RPC_ENDPOINT } from '@entities/cluster';

import { ClusterModal } from '../ClusterModal';

function renderWithStore(initialClusters: SavedCluster[] = []) {
    const store = createStore();
    if (initialClusters.length > 0) {
        store.set(savedClustersAtom, initialClusters);
    }
    return {
        store,
        ...render(
            <Provider store={store}>
                <ClusterModal />
            </Provider>,
        ),
    };
}

describe('ClusterModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        clusterMock.customUrl = CUSTOM_URL;
        nav.searchParams = new URLSearchParams(`cluster=custom&customUrl=${CUSTOM_URL}`);
    });

    it('should render the cluster modal with built-in clusters', () => {
        renderWithStore();
        expect(screen.getByText('Choose a Cluster')).toBeInTheDocument();
        expect(screen.getByText('Mainnet Beta')).toBeInTheDocument();
        expect(screen.getByText('Testnet')).toBeInTheDocument();
        expect(screen.getByText('Devnet')).toBeInTheDocument();
        expect(screen.getByText('Custom RPC URL')).toBeInTheDocument();
    });

    // jsdom has no layout, so the class is the only reachable proxy for "content past the bottom edge
    // stays reachable".
    it('should scroll the body instead of clipping content that overflows the panel', () => {
        renderWithStore();
        expect(screen.getByTestId('cluster-modal-body')).toHaveClass('overflow-y-auto');
    });

    it('should show save button when custom cluster is active', () => {
        renderWithStore();
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('should hide save button when URL is already saved', () => {
        renderWithStore([{ name: 'My Node', url: CUSTOM_URL }]);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    });

    // Selecting Custom with no `customUrl` fills the field with the default before the user has chosen
    // anything, so offering to name that choice names one they never made.
    it('should hide save button while the field holds the default endpoint', () => {
        clusterMock.customUrl = DEFAULT_RPC_ENDPOINT.href;
        renderWithStore();
        expect(screen.getByLabelText('Custom RPC URL')).toHaveValue(DEFAULT_RPC_ENDPOINT.href);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    });

    // Prefilled with the host, so the common case is one click on Save. The path and query stay out of it:
    // that is where providers put the API key, and this panel gets opened on a shared screen.
    it('should prefill the name with the endpoint host after clicking Save this cluster', () => {
        clusterMock.customUrl = 'https://staging.example.com/rpc?api-key=secret';
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('cluster-name-input')).toHaveValue('staging.example.com');
        expect(screen.queryByTestId('name-required-hint')).not.toBeInTheDocument();
    });

    // A second endpoint on the same host would take the same default name, and a repeated name replaces
    // the earlier entry instead of adding one.
    it('should number the suggested name when the host is already saved', () => {
        clusterMock.customUrl = 'https://staging.example.com/rpc?api-key=second';
        renderWithStore([{ name: 'staging.example.com', url: 'https://staging.example.com/rpc?api-key=first' }]);
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('cluster-name-input')).toHaveValue('staging.example.com (2)');
    });

    it('should require a name once the suggestion is cleared', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '' } });
        expect(screen.getByTestId('name-required-hint')).toBeInTheDocument();
    });

    // The field is what stops an unbounded name, before the save has to shorten anything.
    it('should cap the length of a typed cluster name', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('cluster-name-input')).toHaveAttribute('maxLength', '48');
    });

    it('should save a custom cluster', () => {
        const { store } = renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My Node' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'My Node', url: CUSTOM_URL }]);
    });

    it('should trim whitespace from cluster name on save', () => {
        const { store } = renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '  Padded  ' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Padded', url: CUSTOM_URL }]);
    });

    it('should not save when name is empty', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '' } });
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('should not save when name is whitespace only', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '   ' } });
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('should hide save form and clear name on cancel', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'Draft' } });
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByTestId('save-cluster-form')).not.toBeInTheDocument();
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('should display saved clusters', () => {
        renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        expect(screen.getByTestId('saved-clusters-section')).toBeInTheDocument();
        expect(screen.getByText('My Local')).toBeInTheDocument();
        expect(screen.getByText('Staging')).toBeInTheDocument();
    });

    // Clicking an entry commits every later lookup to that server.
    it('should show the host of each saved cluster', () => {
        renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'https://staging.example.com/rpc?api-key=secret' },
        ]);
        expect(screen.getByTestId('saved-cluster-host-My Local')).toHaveTextContent('localhost:8899');
        expect(screen.getByTestId('saved-cluster-host-Staging')).toHaveTextContent('staging.example.com');
    });

    // The default name is the host, so the common entry is one line, not the same string twice.
    it('should drop the host line when the name is already the host', () => {
        renderWithStore([{ name: 'localhost:8899', url: 'http://localhost:8899' }]);
        expect(screen.queryByTestId('saved-cluster-host-localhost:8899')).not.toBeInTheDocument();
        expect(screen.getByText('localhost:8899')).toBeInTheDocument();
    });

    // Providers put the API key in the path or the query, and this panel gets opened on a shared screen.
    it('should keep the path and query out of the visible host line', () => {
        renderWithStore([{ name: 'Staging', url: 'https://staging.example.com/rpc?api-key=secret' }]);
        expect(screen.getByTestId('saved-cluster-host-Staging')).not.toHaveTextContent('api-key=secret');
        // Still reachable on a deliberate hover.
        expect(screen.getByTestId('saved-cluster-link-Staging')).toHaveAttribute(
            'title',
            'Staging — https://staging.example.com/rpc?api-key=secret',
        );
    });

    // jsdom has no layout, so the class is the only reachable proxy for "does not overflow the pill". It
    // sits on each line rather than the pill: `truncate` clips one text flow, and there are two.
    it('should truncate a long saved cluster name and keep it readable via the title', () => {
        const longName = 'dsfdfsdfsdfsdfdfsfsdfsdfsdfsdfsdfsdfsdfsdf';
        renderWithStore([{ name: longName, url: 'http://localhost:8899' }]);
        expect(screen.getByText(longName)).toHaveClass('truncate');
        expect(screen.getByTestId(`saved-cluster-host-${longName}`)).toHaveClass('truncate');
        expect(screen.getByTestId(`saved-cluster-link-${longName}`)).toHaveAttribute(
            'title',
            `${longName} — http://localhost:8899`,
        );
    });

    it('should not render saved clusters section when empty', () => {
        renderWithStore();
        expect(screen.queryByTestId('saved-clusters-section')).not.toBeInTheDocument();
    });

    it('should delete a saved cluster', () => {
        const { store } = renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
    });

    it('should show an error when storage quota is exceeded', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        });
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My Local' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(screen.getByTestId('save-cluster-error')).toBeInTheDocument();
        setItemSpy.mockRestore();
    });

    it('should show save button again after deleting the cluster with matching URL', () => {
        renderWithStore([{ name: 'My Node', url: CUSTOM_URL }]);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('delete-cluster-My Node'));
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });
});

// Every button navigates in place, so each href is the live query string with only the cluster keys
// changed: the page underneath owns the rest and keeps them across a switch.
describe('ClusterModal cluster hrefs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        nav.searchParams = new URLSearchParams(`cluster=custom&customUrl=${CUSTOM_URL}&sort=fee`);
    });

    // A saved cluster's name is a span inside its pill, not the anchor's own text, so it needs a test id.
    const hrefOf = (name: string) => screen.getByText(name).getAttribute('href');

    it('should keep unrelated params when switching to another cluster', () => {
        renderWithStore();
        expect(hrefOf('Devnet')).toBe(`/?cluster=devnet&customUrl=${encodeURIComponent(CUSTOM_URL)}&sort=fee`);
    });

    it('should express the default cluster as the absence of the param', () => {
        renderWithStore();
        expect(hrefOf('Mainnet Beta')).toBe(`/?customUrl=${encodeURIComponent(CUSTOM_URL)}&sort=fee`);
    });

    it('should point a saved cluster at its own endpoint', () => {
        renderWithStore([{ name: 'Staging', url: 'http://staging.example.com' }]);
        expect(screen.getByTestId('saved-cluster-link-Staging')).toHaveAttribute(
            'href',
            `/?cluster=custom&customUrl=${encodeURIComponent('http://staging.example.com')}&sort=fee`,
        );
    });

    it('should leave the endpoint untouched when re-selecting the custom cluster', () => {
        // Building from `customUrl` instead would re-add an endpoint the reader already stripped, costing
        // a wasted navigation on every click.
        nav.searchParams = new URLSearchParams('cluster=devnet&sort=fee');
        renderWithStore();
        expect(hrefOf('Custom RPC URL')).toBe('/?cluster=custom&sort=fee');
    });

    it('should replace history when committing a typed URL, not push', () => {
        vi.useFakeTimers();
        try {
            renderWithStore();
            // Not `CUSTOM_URL`: the field already holds it, and React fires no change event for an
            // unchanged value, so nothing would be committed to assert on.
            fireEvent.change(screen.getByLabelText('Custom RPC URL'), {
                target: { value: 'http://typed-node:8899' },
            });
            act(() => vi.advanceTimersByTime(500));

            // One entry per typing pause, each a half-typed URL, would make the back button useless.
            expect(nav.push).not.toHaveBeenCalled();
            expect(nav.replace).toHaveBeenCalledWith(
                `/?cluster=custom&customUrl=${encodeURIComponent('http://typed-node:8899')}&sort=fee`,
            );
        } finally {
            vi.useRealTimers();
        }
    });

    it('should drop the endpoint when deleting the saved cluster the page is pointed at', () => {
        renderWithStore([{ name: 'My Local', url: CUSTOM_URL }]);
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(nav.push).toHaveBeenCalledWith('/?sort=fee');
    });
});

// Choosing an endpoint in the switcher is a first-party action, so it is its own consent. Otherwise the
// user's own endpoint reaches the reader looking like an unvetted link, asking them to confirm what they
// just did.
describe('ClusterModal endpoint consent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        clusterMock.customUrl = CUSTOM_URL;
        nav.searchParams = new URLSearchParams(`cluster=custom&customUrl=${CUSTOM_URL}&sort=fee`);
    });

    function typeUrl(value: string) {
        fireEvent.change(screen.getByLabelText('Custom RPC URL'), { target: { value } });
        act(() => vi.advanceTimersByTime(500));
    }

    it('should approve the origin of a typed endpoint before navigating to it', () => {
        vi.useFakeTimers();
        try {
            const { store } = renderWithStore();
            typeUrl('https://my-node.example/rpc?api-key=secret');

            // Origin only — a rotated key on the same server must not ask again.
            expect(store.get(approvedOriginsAtom)).toEqual(['https://my-node.example']);
            expect(nav.replace).toHaveBeenCalledWith(
                `/?cluster=custom&customUrl=${encodeURIComponent('https://my-node.example/rpc?api-key=secret')}&sort=fee`,
            );
        } finally {
            vi.useRealTimers();
        }
    });

    it('should not navigate on a half-typed value', () => {
        vi.useFakeTimers();
        try {
            const { store } = renderWithStore();
            typeUrl('https:/');

            // Not an endpoint yet. Navigating would churn the URL, and the reader would strip each attempt.
            expect(store.get(approvedOriginsAtom)).toEqual([]);
            expect(nav.replace).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it('should clear the endpoint when the field is emptied', () => {
        vi.useFakeTimers();
        try {
            renderWithStore();
            typeUrl('');

            expect(nav.replace).toHaveBeenCalledWith('/?cluster=custom&sort=fee');
        } finally {
            vi.useRealTimers();
        }
    });

    it('should approve a saved cluster when it is selected', () => {
        const { store } = renderWithStore([{ name: 'Staging', url: 'https://staging.example.com/rpc' }]);

        // A real anchor, so stop jsdom navigating. React's handler is delegated at the root and still
        // runs: `preventDefault` does not stop propagation.
        const link = screen.getByTestId('saved-cluster-link-Staging');
        link.addEventListener('click', event => event.preventDefault());
        fireEvent.click(link);

        expect(store.get(approvedOriginsAtom)).toEqual(['https://staging.example.com']);
    });

    it('should not echo a committed endpoint back over what the user is still typing', () => {
        vi.useFakeTimers();
        try {
            renderWithStore();
            const input = screen.getByLabelText('Custom RPC URL');

            // Commit one value...
            typeUrl('https://a.io');
            // ...then let that navigation land, which is when the render-phase re-sync fires...
            clusterMock.customUrl = 'https://a.io';
            // ...while the user is still typing the rest of the URL.
            fireEvent.change(input, { target: { value: 'https://a.io/rpc' } });

            // Without the guard the arriving value overwrites the draft and the keystrokes are lost.
            expect(input).toHaveValue('https://a.io/rpc');
        } finally {
            vi.useRealTimers();
        }
    });
});

// The field's rules live in the hook's own spec (`model/__tests__/use-custom-url-draft.spec.tsx`). What
// is left here is the wiring: the value the hook reports is the value the input shows.
describe('ClusterModal custom URL field', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        clusterMock.customUrl = CUSTOM_URL;
        nav.searchParams = new URLSearchParams(`cluster=custom&customUrl=${CUSTOM_URL}`);
    });

    it('should show the endpoint of a selected saved cluster', () => {
        const { rerender, store } = renderWithStore([
            { name: 'A', url: 'https://a.io' },
            { name: 'B', url: 'https://b.io' },
        ]);
        clusterMock.customUrl = 'https://b.io';
        rerender(
            <Provider store={store}>
                <ClusterModal />
            </Provider>,
        );
        expect(screen.getByLabelText('Custom RPC URL')).toHaveValue('https://b.io');
    });
});
