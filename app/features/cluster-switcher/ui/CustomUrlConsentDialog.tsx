'use client';

import { Button } from '@components/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@components/shared/ui/dialog';
import type { RpcEndpoint } from '@entities/cluster';
import { Alert } from '@shared/ui/Alert';
import { useRef } from 'react';

// Two things share this dialog: a link supplying an endpoint nobody has agreed to, and the developer
// toggle that stops asking altogether.
export type ConsentRequest = { kind: 'endpoint'; endpoint: RpcEndpoint } | { kind: 'developer-bypass' };

// One step above the cluster sidebar's `z-[1060]`, the highest of the legacy dashkit layers. The
// developer-bypass confirmation renders from inside that sidebar, and the endpoint prompt has to stay on
// top if the user opens the switcher while it is waiting for an answer.
const CONSENT_Z_INDEX = 1070;

type Props = {
    request: ConsentRequest | undefined;
    onConfirm: () => void;
    onCancel: () => void;
};

export function CustomUrlConsentDialog({ request, onConfirm, onCancel }: Props) {
    // What the dialog shows, which outlives what it is asking: the same `undefined` that closes it would
    // otherwise blank the body, and the content stays on screen for the whole exit animation.
    const shown = useRetainedRequest(request);

    // Anything that closes the dialog — Escape, the X, Cancel — is a decline: the safe outcome has to be
    // the default one. A click outside closes nothing, though: this asks a security question, and a stray
    // click on the backdrop is not an answer to it.
    return (
        <Dialog open={request !== undefined} onOpenChange={open => !open && onCancel()}>
            <DialogContent
                data-testid="custom-url-consent"
                zIndex={CONSENT_Z_INDEX}
                onInteractOutside={event => event.preventDefault()}
            >
                {/* Per kind, never a two-way ternary: the request the dialog closed on is `undefined`, and an
                    `else` branch would answer one question with the other one's copy. */}
                {shown?.kind === 'endpoint' ? (
                    <EndpointConsent endpoint={shown.endpoint} onConfirm={onConfirm} onCancel={onCancel} />
                ) : shown?.kind === 'developer-bypass' ? (
                    <BypassConsent onConfirm={onConfirm} onCancel={onCancel} />
                ) : undefined}
            </DialogContent>
        </Dialog>
    );
}

function EndpointConsent({
    endpoint,
    onConfirm,
    onCancel,
}: { endpoint: RpcEndpoint } & Pick<Props, 'onCancel' | 'onConfirm'>) {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Connect to this RPC server?</DialogTitle>
                <DialogDescription>
                    A link asked the Explorer to load Solana data from a server instead of a public cluster.
                </DialogDescription>
            </DialogHeader>

            {/* The host is the decision, so it gets its own line in full: a lookalike domain reads as the
                real thing inside a sentence. */}
            <div className="border border-dk-gray-700 bg-dk-black p-3">
                <div className="break-all font-mono text-base" data-testid="consent-host">
                    {endpoint.host}
                </div>
                {endpoint.hasPathOrQuery && (
                    <div className="mt-1.5 break-all text-xs text-dk-gray-700" data-testid="consent-full-url">
                        {endpoint.href}
                    </div>
                )}
            </div>

            <p className="text-dk-gray-700">
                Everything you look up is sent to this server, and the Explorer shows whatever it returns — balances,
                token details and transaction results included. Only continue if you trust whoever gave you the link.
            </p>

            <DialogFooter>
                <Button ui="dashkit" variant="white" onClick={onCancel} data-testid="consent-cancel">
                    Cancel
                </Button>
                <Button ui="dashkit" variant="primary" onClick={onConfirm} data-testid="consent-confirm">
                    Connect
                </Button>
            </DialogFooter>
        </>
    );
}

function BypassConsent({ onConfirm, onCancel }: Pick<Props, 'onCancel' | 'onConfirm'>) {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Stop asking about custom RPC servers?</DialogTitle>
                <DialogDescription>This is a developer setting. It changes how links are treated.</DialogDescription>
            </DialogHeader>

            <Alert variant="danger" className="mb-0">
                While this is on, any link you open can point the Explorer at any RPC server without asking you first.
            </Alert>

            <p className="text-dk-gray-700">
                It stays on in this browser until you turn it off. Leave it off unless you are testing against your own
                endpoints.
            </p>

            <DialogFooter>
                <Button ui="dashkit" variant="white" onClick={onCancel} data-testid="consent-cancel">
                    Cancel
                </Button>
                <Button ui="dashkit" variant="danger" onClick={onConfirm} data-testid="consent-confirm">
                    Turn on anyway
                </Button>
            </DialogFooter>
        </>
    );
}

// Radix keeps the content mounted until the exit animation ends (`duration-200` on `DialogContent`), so the
// request has to outlive the prop that cleared it. Retaining it also keeps the endpoint's host on screen
// while the box fades, rather than collapsing it onto nothing.
function useRetainedRequest(request: ConsentRequest | undefined) {
    const retained = useRef(request);
    if (request !== undefined) retained.current = request;
    return retained.current;
}
