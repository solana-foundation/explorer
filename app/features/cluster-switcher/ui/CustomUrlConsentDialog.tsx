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
import { cn } from '@components/shared/utils';
import type { RpcEndpoint } from '@entities/cluster';
import { useRef } from 'react';
import { AlertTriangle, ChevronRight } from 'react-feather';

export type ConsentRequest = { kind: 'endpoint'; endpoint: RpcEndpoint } | { kind: 'developer-bypass' };

const CONSENT_Z_INDEX = 1210;

const PLATE_CLASSES = 'rounded-md border border-solid border-white/10 bg-outer-space-800 p-3 text-left';
const LABEL_CLASSES = 'text-xs uppercase text-outer-space-300';
const ACTION_CLASSES = 'focus-visible:!ring-1 focus-visible:!ring-accent focus-visible:!ring-offset-0';
const DANGER_CLASSES = '!bg-dk-danger hover:!bg-dk-danger/90';
const DETAILS_CLASSES = 'text-left [&[open]]:pb-2 [&[open]_svg]:rotate-90';
const SUMMARY_CLASSES = cn(
    'flex cursor-pointer list-none items-center gap-1.5 text-[13px] text-outer-space-300',
    'transition-colors hover:text-white [&::-webkit-details-marker]:hidden',
);
const FOLD_TEXT_CLASSES = 'text-[13px] leading-relaxed text-outer-space-300';
const FOOTER_CLASSES = '!flex-row !justify-start gap-2 pt-1 sm:!space-x-0';
const SCROLL_CLASSES = 'mb-5 flex max-h-[60dvh] flex-col gap-2 overflow-y-auto text-left';
const CONTENT_CLASSES = '!gap-3 !border-outer-space-800 !bg-outer-space-900 !p-5 !pt-6';

type Props = {
    request: ConsentRequest | undefined;
    onConfirm: () => void;
    onCancel: () => void;
};

export function CustomUrlConsentDialog({ request, onConfirm, onCancel }: Props) {
    const shown = useRetainedRequest(request);

    return (
        <Dialog open={request !== undefined} onOpenChange={open => !open && onCancel()}>
            <DialogContent
                data-testid="custom-url-consent"
                zIndex={CONSENT_Z_INDEX}
                className={CONTENT_CLASSES}
                onInteractOutside={event => event.preventDefault()}
            >
                {shown?.kind === 'endpoint' ? (
                    <EndpointConsent endpoint={shown.endpoint} onConfirm={onConfirm} onCancel={onCancel} />
                ) : shown?.kind === 'developer-bypass' ? (
                    <BypassConsent onConfirm={onConfirm} onCancel={onCancel} />
                ) : undefined}
            </DialogContent>
        </Dialog>
    );
}

function WarningHeader({ question }: { question: string }) {
    return (
        <DialogHeader className="!space-y-0 !text-left">
            <DialogTitle className="!text-xl !font-medium !leading-snug !text-dk-danger">
                <AlertTriangle size={24} aria-hidden className="mr-2 inline-block align-[-0.2em]" />
                {question}
            </DialogTitle>
        </DialogHeader>
    );
}

function Stakes({ children }: { children: React.ReactNode }) {
    return <DialogDescription className="m-0 !text-[13px] leading-relaxed !text-white">{children}</DialogDescription>;
}

function ServerPowersFold({ summary }: { summary: string }) {
    return (
        <details className={DETAILS_CLASSES}>
            <summary className={SUMMARY_CLASSES}>
                <ChevronRight size={14} aria-hidden className="shrink-0 transition-transform" />
                {summary}
            </summary>
            <ul className={cn('m-0 mt-2 flex list-disc flex-col gap-1.5 pl-8', FOLD_TEXT_CLASSES)}>
                <li>
                    See your address, the time, and every account, signature, token and block you look at — one visit to
                    your own wallet ties the two together.
                </li>
                <li>
                    Answer with whatever it likes: balances, account owners, token details, the status of a transaction.
                    The page shows what it returns, so a payment can be made to look settled.
                </li>
                <li>Leave things out — a transaction, an instruction, an account — which reads as absence.</li>
                <li>
                    Shape what you are about to sign: the account data and the simulation an interactive IDL shows you
                    come from it, and it receives the signed transaction before the network does.
                </li>
            </ul>
            <p className={cn('m-0 mt-2 pl-8', FOLD_TEXT_CLASSES)}>
                It never sees your keys, and nothing is signed without your wallet asking you first.
            </p>
        </details>
    );
}

function Actions({
    cancelLabel,
    confirmLabel,
    onCancel,
    onConfirm,
}: { cancelLabel: string; confirmLabel: string } & Pick<Props, 'onCancel' | 'onConfirm'>) {
    return (
        <DialogFooter className={cn(FOOTER_CLASSES, '!items-center')}>
            <Button
                size="lg"
                variant="destructive"
                className={cn(ACTION_CLASSES, DANGER_CLASSES)}
                onClick={onConfirm}
                data-testid="consent-confirm"
            >
                {confirmLabel}
            </Button>
            <Button
                size="lg"
                variant="outline"
                className={ACTION_CLASSES}
                onClick={onCancel}
                data-testid="consent-cancel"
            >
                {cancelLabel}
            </Button>
        </DialogFooter>
    );
}

function EndpointConsent({
    endpoint,
    onConfirm,
    onCancel,
}: { endpoint: RpcEndpoint } & Pick<Props, 'onCancel' | 'onConfirm'>) {
    return (
        <>
            <WarningHeader question="Connect to an unknown RPC server?" />

            <div className={SCROLL_CLASSES}>
                <Stakes>
                    A link asked the Explorer to read its data from this server instead of a public cluster. Connect
                    only if you trust whoever sent the link.
                </Stakes>

                <div className={PLATE_CLASSES}>
                    <div className={LABEL_CLASSES}>Server</div>
                    <div className="mt-1 break-all font-mono text-sm text-white" data-testid="consent-host">
                        {endpoint.href}
                    </div>
                </div>

                <ServerPowersFold summary="What this server can do" />
            </div>

            <Actions confirmLabel="Connect" cancelLabel="Reject" onConfirm={onConfirm} onCancel={onCancel} />
        </>
    );
}

function BypassConsent({ onConfirm, onCancel }: Pick<Props, 'onCancel' | 'onConfirm'>) {
    return (
        <>
            <WarningHeader question="Trust any RPC server?" />

            <div className={SCROLL_CLASSES}>
                <Stakes>
                    Any link could then point the Explorer at its own RPC server, with no question asked. Only for
                    testing your own endpoints.
                </Stakes>
                <ServerPowersFold summary="What a server chosen this way can do" />
            </div>

            <Actions confirmLabel="Trust" cancelLabel="Keep asking" onConfirm={onConfirm} onCancel={onCancel} />
        </>
    );
}

function useRetainedRequest(request: ConsentRequest | undefined) {
    const retained = useRef(request);
    if (request !== undefined) retained.current = request;
    return retained.current;
}
