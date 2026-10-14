'use client';

import React, { useState } from 'react';

import { cn } from '@/app/components/shared/utils';

import { INSPECT_ENTITY_RESPONSE } from '../lib/tool-reference';
import { CardTabs } from './CardTabs';
import { BandIntro } from './NumberedBand';

const TOOL_VIEWS = [
    { id: 'request', label: 'Request' },
    { id: 'response', label: 'Response' },
];

export function Tools() {
    return (
        <>
            <BandIntro title="Two tools cover the whole chain">
                The server registers two tools. Both are read-only — nothing signs, sends or mutates.
            </BandIntro>
            <ToolDoc
                name="inspect_entity"
                description="Retrieves detailed on-chain data for any Solana address or transaction signature. The tool detects which one it was given."
                request={
                    <>
                        <ToolParam name="identifier" requirement="required">
                            A base58 string, 1–128 characters: a 32-byte account address or a 64-byte transaction
                            signature.
                        </ToolParam>
                        <ToolParam name="cluster" requirement="optional">
                            One of mainnet-beta, devnet, testnet. Defaults to mainnet-beta.
                        </ToolParam>
                    </>
                }
                response={
                    <pre className="m-0 whitespace-pre-wrap px-5 pb-5 pt-5 font-mono text-xs leading-6 text-dark-foreground [overflow-wrap:anywhere]">
                        {INSPECT_ENTITY_RESPONSE}
                    </pre>
                }
                note={
                    <p className="m-0 max-w-3xl text-sm leading-5 text-heavy-metal-300">
                        Accounts owned by the legacy loaders are not supported yet and answer with a{' '}
                        <span className="font-mono text-sm text-dark-foreground">CURRENTLY_UNSUPPORTED</span> error.
                        Fields that cannot be resolved come back as explicit unknown markers rather than being dropped.
                    </p>
                }
            />
            <ToolDoc
                name="ping"
                description="Basic health tool. Takes no arguments and answers pong. Ask the agent to call it to verify the connection end-to-end."
                request={<ToolParam name="{}">No parameters — the probe takes an empty argument object.</ToolParam>}
                response={
                    <ToolParam name="pong">
                        Answers <span className="font-mono text-sm text-dark-foreground">pong</span>. Ask the agent to
                        call it to verify the connection end-to-end.
                    </ToolParam>
                }
            />
        </>
    );
}

function ToolDoc({
    description,
    name,
    note,
    request,
    response,
}: {
    description: string;
    name: string;
    note?: React.ReactNode;
    request: React.ReactNode;
    response: React.ReactNode;
}) {
    const [view, setView] = useState(TOOL_VIEWS[0].id);

    return (
        <div className="flex w-full flex-col gap-3 pt-6">
            <div className="flex w-fit items-center gap-3">
                <span className="font-mono text-base text-dark-foreground">{name}</span>
                <span className="rounded-md bg-accent-900 px-2 py-0.5 font-mono text-xs tracking-wider text-dark-accent">
                    read-only
                </span>
            </div>
            <p className="m-0 max-w-3xl text-base leading-6 text-heavy-metal-300">{description}</p>

            <div className="mt-2 w-full overflow-hidden rounded-lg border border-solid border-dark-border bg-outer-space-950">
                <div className="flex w-full items-stretch gap-2.5 border-0 border-b border-solid border-dark-border px-5">
                    <CardTabs items={TOOL_VIEWS} onChange={setView} value={view} />
                </div>
                <div className="w-full">{view === 'request' ? request : response}</div>
            </div>
            {note}
        </div>
    );
}

function ToolParam({
    children,
    name,
    requirement,
}: {
    children: React.ReactNode;
    name: string;
    requirement?: 'required' | 'optional';
}) {
    return (
        <div
            className={cn(
                'flex w-full flex-col gap-2 px-5 py-3.5 lg:flex-row lg:items-baseline lg:gap-6',
                'border-0 border-t border-solid border-dark-border first:border-t-0',
            )}
        >
            <div className="flex w-full items-baseline gap-2.5 lg:w-[220px] lg:shrink-0">
                <span className="font-mono text-sm text-dark-foreground">{name}</span>
                {requirement && (
                    <span
                        className={cn(
                            'text-xs',
                            requirement === 'required' ? 'text-dark-accent' : 'text-heavy-metal-500',
                        )}
                    >
                        {requirement}
                    </span>
                )}
            </div>
            <p className="m-0 text-sm leading-5 text-heavy-metal-300 lg:flex-1">{children}</p>
        </div>
    );
}
