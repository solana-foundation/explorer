import { fireEvent, render, screen } from '@testing-library/react';
import { Component, type ReactNode, Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import useSWR, { SWRConfig } from 'swr';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import AddressTabError from '../error';

const sentry = vi.hoisted(() => ({ captureException: vi.fn(), captureMessage: vi.fn() }));

vi.unmock('@/app/shared/lib/logger');
vi.mock('@sentry/nextjs', () => ({
    ...sentry,
    withScope: (callback: (scope: object) => void) =>
        callback({ setExtras: vi.fn(), setLevel: vi.fn(), setTag: vi.fn() }),
}));

describe('AddressTabError', () => {
    it('should not send the error to Sentry', () => {
        render(<AddressTabError error={new Error('tab failed')} reset={vi.fn()} />);

        expect(sentry.captureException).not.toHaveBeenCalled();
    });

    it('should fetch a failed suspense request again when the user retries', async () => {
        const fetcher = vi.fn().mockRejectedValueOnce(new Error('HTTP error (503)')).mockResolvedValue('tab data');
        createRootWithoutAct().render(
            <Providers>
                <TabBoundary>
                    <Suspense fallback="Loading">
                        <SuspenseTab fetcher={fetcher} />
                    </Suspense>
                </TabBoundary>
            </Providers>,
        );
        const [tryAgain] = await screen.findAllByText('Try Again');

        tryAgain.click();

        expect(await screen.findByText('tab data')).toBeInTheDocument();
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should fetch a failed request outside the tab again when the user retries', async () => {
        const fetcher = vi.fn().mockRejectedValueOnce(new Error('HTTP error (503)')).mockResolvedValue('header data');
        render(
            <Providers>
                <Header fetcher={fetcher} />
                <AddressTabError error={new Error('tab failed')} reset={vi.fn()} />
            </Providers>,
        );
        await screen.findByText('header failed');

        fireEvent.click(screen.getAllByText('Try Again')[0]);

        expect(await screen.findByText('header data')).toBeInTheDocument();
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should keep the data of a request whose refresh failed when the user retries', () => {
        const stale = { data: 'stale data', error: new Error('HTTP error (503)') };
        const cache = new Map([['stale', stale]]);
        render(
            <SWRConfig value={{ provider: () => cache }}>
                <AddressTabError error={new Error('tab failed')} reset={vi.fn()} />
            </SWRConfig>,
        );

        fireEvent.click(screen.getAllByText('Try Again')[0]);

        expect(cache.get('stale')).toBe(stale);
    });

    it('should keep a request that has not failed when the user retries', () => {
        const pending = { isLoading: true, isValidating: true };
        const cache = new Map([['pending', pending]]);
        render(
            <SWRConfig value={{ provider: () => cache }}>
                <AddressTabError error={new Error('tab failed')} reset={vi.fn()} />
            </SWRConfig>,
        );

        fireEvent.click(screen.getAllByText('Try Again')[0]);

        expect(cache.get('pending')).toBe(pending);
    });
});

function createRootWithoutAct(): Root {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
    const container = document.body.appendChild(document.createElement('div'));
    const root = createRoot(container);
    onTestFinished(() => {
        root.unmount();
        container.remove();
        vi.unstubAllGlobals();
    });
    return root;
}

function Providers({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
    );
}

class TabBoundary extends Component<{ children: ReactNode }, { error: Error | undefined }> {
    state: { error: Error | undefined } = { error: undefined };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;
        return <AddressTabError error={error} reset={() => this.setState({ error: undefined })} />;
    }
}

function SuspenseTab({ fetcher }: { fetcher: () => Promise<string> }) {
    const { data } = useSWR('tab', fetcher, { suspense: true });
    return <p>{data}</p>;
}

function Header({ fetcher }: { fetcher: () => Promise<string> }) {
    const { data, error } = useSWR('header', fetcher);
    return <p>{error ? 'header failed' : data}</p>;
}
