import { act, render } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHydrated } from '../use-hydrated';

// Renders the answer, so the assertions read the same DOM React hydrates against.
function Probe() {
    return <span>{useHydrated() ? 'hydrated' : 'not-hydrated'}</span>;
}

const roots: { unmount: () => void }[] = [];
afterEach(() => {
    while (roots.length > 0) act(() => roots.pop()?.unmount());
});

function hydrate(serverMarkup: string) {
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    document.body.append(container);
    const onRecoverableError = vi.fn();
    act(() => {
        roots.push(hydrateRoot(container, <Probe />, { onRecoverableError }));
    });
    return { container, onRecoverableError };
}

describe('useHydrated', () => {
    it('should stay false through the render that hydrates the server markup, then turn true', () => {
        // Reading true while hydrating makes the markup disagree with the server's — the error this hook
        // prevents, which React reports through `onRecoverableError`.
        // eslint-disable-next-line testing-library/render-result-naming-convention -- an HTML string, not a testing-library render result
        const serverMarkup = renderToString(<Probe />);
        expect(serverMarkup).toContain('not-hydrated');

        const { container, onRecoverableError } = hydrate(serverMarkup);

        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(container.textContent).toBe('hydrated');
    });

    it('should be true from the first render when there is no server markup to match', () => {
        // A client-side navigation, a test or a story rendered no server markup, so nothing has to be
        // deferred and consumers pay for no extra render.
        const { container } = render(<Probe />);

        expect(container.textContent).toBe('hydrated');
    });
});
