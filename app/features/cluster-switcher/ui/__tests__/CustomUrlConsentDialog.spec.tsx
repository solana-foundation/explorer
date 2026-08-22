import { rpcEndpoint } from '@entities/cluster';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type ConsentRequest, CustomUrlConsentDialog } from '../CustomUrlConsentDialog';

const ENDPOINT_REQUEST: ConsentRequest = { endpoint: rpcEndpoint('https://my-node.example/rpc'), kind: 'endpoint' };
const BYPASS_REQUEST: ConsentRequest = { kind: 'developer-bypass' };

const ENDPOINT_QUESTION = 'Connect to this RPC server?';
const BYPASS_QUESTION = 'Stop asking about custom RPC servers?';

describe('CustomUrlConsentDialog', () => {
    afterEach(() => vi.restoreAllMocks());

    it('should keep the endpoint question on screen while it animates closed', () => {
        // Answering used to swap the copy on the way out: the last thing a visitor saw after refusing one
        // server was a red button offering to stop asking about all of them.
        stubExitAnimation();
        const { close } = renderDialog(ENDPOINT_REQUEST);

        close();

        expect(screen.getByTestId('custom-url-consent')).toHaveAttribute('data-state', 'closed');
        expect(screen.getByText(ENDPOINT_QUESTION)).toBeInTheDocument();
        expect(screen.getByTestId('consent-host')).toHaveTextContent('my-node.example');
        expect(screen.queryByText(BYPASS_QUESTION)).not.toBeInTheDocument();
    });

    it('should keep the bypass question on screen while it animates closed', () => {
        stubExitAnimation();
        const { close } = renderDialog(BYPASS_REQUEST);

        close();

        expect(screen.getByTestId('custom-url-consent')).toHaveAttribute('data-state', 'closed');
        expect(screen.getByText(BYPASS_QUESTION)).toBeInTheDocument();
        expect(screen.queryByText(ENDPOINT_QUESTION)).not.toBeInTheDocument();
    });

    it('should ask nothing before a request arrives', () => {
        renderDialog(undefined);

        expect(screen.queryByTestId('custom-url-consent')).not.toBeInTheDocument();
    });
});

function renderDialog(request: ConsentRequest | undefined) {
    const props = { onCancel: vi.fn(), onConfirm: vi.fn() };
    const { rerender } = render(<CustomUrlConsentDialog request={request} {...props} />);
    // Answering clears the request, which is all a caller of this dialog does — both of them derive it from
    // state the answer resolves.
    return { close: () => rerender(<CustomUrlConsentDialog request={undefined} {...props} />) };
}

// Radix holds the dialog mounted until its exit animation ends, and jsdom runs no animations: without this
// the content unmounts on the tick that closes it, and the closing render — the one this file is about —
// never happens. `Presence` decides from `getComputedStyle().animationName`, so report what the stylesheet
// would for the state Radix has just written to the DOM.
function stubExitAnimation() {
    const computeStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudoElement) => {
        const styles = computeStyle(element, pseudoElement ?? undefined);
        return new Proxy(styles, {
            get(target, property) {
                if (property === 'animationName') {
                    return element.getAttribute('data-state') === 'closed' ? 'exit' : 'enter';
                }
                const value = Reflect.get(target, property);
                return typeof value === 'function' ? value.bind(target) : value;
            },
        });
    });
}
