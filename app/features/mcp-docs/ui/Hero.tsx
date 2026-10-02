'use client';

import { useRef } from 'react';
import { Check, Copy, ExternalLink, XCircle } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { BAND_RULE, EndpointState, type EndpointStatus, GUTTER, MONO_LABEL } from '../lib/mcp-docs-layout';
import { GravityCta } from './GravityCta';

const MCP_README = 'https://github.com/solana-foundation/explorer/blob/master/app/mcp/README.md';

export function Hero({ origin, status }: { origin: string; status: EndpointStatus }) {
    const fieldRef = useRef<HTMLDivElement>(null);

    const host = origin.replace('https://', '').replace('http://', '');
    const facts = [
        { key: 'Transport', value: 'Streamable HTTP, stateless' },
        {
            key: 'Auth',
            value: status.state === EndpointState.Restricted ? 'Access key required' : 'Open — no key required',
        },
        { key: 'Clusters', value: 'mainnet-beta · devnet · testnet' },
        { key: 'Tools', value: 'inspect_entity · ping' },
    ];

    return (
        <div ref={fieldRef} className={cn('relative w-full overflow-hidden pb-7 pt-12 sm:pt-16', GUTTER, BAND_RULE)}>
            <div className="relative z-[1] flex w-full flex-col gap-9">
                <h1 className="m-0 mt-20 text-4xl font-normal leading-none tracking-tight text-dark-foreground sm:mt-28 sm:text-5xl sm:leading-none sm:tracking-tight lg:text-6xl lg:leading-none lg:tracking-tight xxl:text-7xl xxl:leading-none xxl:tracking-tight">
                    Live on-chain data for coding&nbsp;agents
                </h1>

                <div className="-mt-6 flex w-full flex-col gap-14 pt-3 sm:gap-16 lg:mt-0 lg:flex-row lg:gap-16">
                    <div className="flex w-full flex-col items-start gap-7 lg:flex-1">
                        <p className="m-0 text-base leading-6 text-heavy-metal-300 sm:text-lg sm:leading-7 lg:max-w-3xl">
                            Connect your MCP client to the Explorer and let your agent read decoded on-chain state —
                            accounts, programs, tokens and transactions — with the same IDL decoding and enrichments the
                            Explorer renders.
                        </p>

                        <GravityCta
                            href="#setup"
                            fieldRef={fieldRef}
                            className="text-base"
                            desktopScope="heroDesktop"
                            mobileDotScale={2 / 3}
                            mobilePullScale={0.5}
                            zoneTop={1 / 3}
                            zoneBottom={2 / 3}
                        >
                            Give your agent the context
                        </GravityCta>
                    </div>

                    <div className="flex w-full flex-col lg:w-[30vw]">
                        <div className="flex w-full items-stretch gap-2.5 border-0 border-b border-solid border-dark-border pb-3.5 lg:max-w-sm">
                            <span
                                aria-hidden
                                className={cn(
                                    'my-0.5 w-0.5 shrink-0 self-stretch rounded-full',
                                    status.state === EndpointState.Ready && 'bg-dark-accent',
                                    (status.state === EndpointState.Restricted ||
                                        status.state === EndpointState.Blocked) &&
                                        'bg-amber-400',
                                    (status.state === EndpointState.Checking ||
                                        status.state === EndpointState.Disabled) &&
                                        'bg-heavy-metal-300',
                                )}
                            />
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <EndpointAddress display={`${host}/mcp`} value={`${origin}/mcp`} />
                                <StatusNote status={status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:flex lg:max-w-sm lg:flex-col">
                            {facts.map((fact, index) => (
                                <div
                                    key={fact.key}
                                    className={cn(
                                        'flex min-w-0 flex-col gap-2 border-0 border-solid border-dark-border py-3.5',
                                        'lg:flex-row lg:items-baseline lg:gap-4 lg:border-b-0 lg:py-2.5',
                                        index % 2 === 0 ? 'pr-5 lg:pr-0' : 'pl-5 lg:pl-0',
                                        index < 2 && 'border-b lg:border-b-0',
                                        index > 0 && 'lg:border-t',
                                    )}
                                >
                                    <div className="flex items-center gap-2 lg:w-[90px] lg:shrink-0">
                                        <span className={cn(MONO_LABEL, 'text-heavy-metal-300')}>{fact.key}</span>
                                    </div>
                                    <span className="text-sm leading-5 text-dark-foreground [overflow-wrap:anywhere] lg:flex-1">
                                        {fact.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusNote({ status }: { status: EndpointStatus }) {
    if (status.state === EndpointState.Checking) {
        return <span className="text-sm text-heavy-metal-300">Checking…</span>;
    }
    if (status.state === EndpointState.Disabled) {
        return (
            <span className="flex w-fit items-center text-sm text-heavy-metal-300">
                Disabled
                <span className="mx-1.5 text-heavy-metal-500" aria-hidden>
                    —
                </span>
                <a
                    href={MCP_README}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-dark-accent no-underline"
                >
                    How to run
                    <ExternalLink size={11} aria-hidden />
                </a>
            </span>
        );
    }
    if (status.state === EndpointState.Restricted || status.state === EndpointState.Blocked) {
        return (
            <span className="flex w-fit items-center text-sm text-amber-300">
                {status.state === EndpointState.Restricted
                    ? 'Restricted — access key required'
                    : 'Blocked — your IP isn’t allowed'}
                <span className="mx-1.5 text-heavy-metal-500" aria-hidden>
                    —
                </span>
                <a
                    href={MCP_README}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-dark-accent no-underline"
                >
                    How to run
                    <ExternalLink size={11} aria-hidden />
                </a>
            </span>
        );
    }
    return <span className="text-sm text-dark-accent">Ready</span>;
}

const COPY_ICON = {
    copied: <Check size={12} aria-hidden />,
    copy: <Copy size={12} aria-hidden />,
    errored: <XCircle size={12} aria-hidden />,
};

function EndpointAddress({ display, value }: { display: string; value: string }) {
    const [state, copy] = useCopyToClipboard(1000);
    return (
        <span className="font-mono text-sm text-dark-foreground [overflow-wrap:anywhere]">
            <span className="cursor-copy" onDoubleClick={() => copy(value)} title="Double-click to copy">
                {display}
            </span>
            <button
                type="button"
                aria-label="Copy endpoint to clipboard"
                onClick={() => copy(value)}
                className={cn(
                    'ml-1 inline-flex size-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 align-middle',
                    'text-heavy-metal-500 hover:bg-dark-border hover:text-dark-foreground',
                    state === 'copied' && 'text-dark-accent hover:text-dark-accent',
                    state === 'errored' && 'text-red-500 hover:text-red-500',
                )}
            >
                {COPY_ICON[state]}
            </button>
        </span>
    );
}
