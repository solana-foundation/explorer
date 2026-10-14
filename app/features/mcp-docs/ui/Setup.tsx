'use client';

import { useState } from 'react';
import { Check, ExternalLink } from 'react-feather';

import { SETUP_CLIENTS } from '../lib/setup-clients';
import { CardTabs } from './CardTabs';
import { CodeCard } from './CodeCard';
import { BandIntro } from './NumberedBand';

const MCP_README = 'https://github.com/solana-foundation/explorer/blob/master/app/mcp/README.md';

export function Setup({ isRestricted, origin }: { isRestricted: boolean; origin: string }) {
    const [client, setClient] = useState(SETUP_CLIENTS[0].id);
    const active = SETUP_CLIENTS.find(candidate => candidate.id === client) ?? SETUP_CLIENTS[0];

    return (
        <>
            <BandIntro title="Pick your client, paste one line">
                {isRestricted
                    ? 'Pick your tool, copy the config — snippets already point at this deployment and carry an Authorization header. Replace <access-key> with the key this deployment was configured with before connecting.'
                    : 'Pick your tool, copy the config — snippets already point at this deployment. No API key needed.'}
            </BandIntro>
            {isRestricted && (
                <p className="m-0 flex w-full flex-wrap items-baseline gap-x-1.5 gap-y-1 rounded-lg border border-solid border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-5 text-amber-200">
                    This endpoint is gated — the snippets include an Authorization header; swap
                    <code className="font-mono text-amber-100">&lt;access-key&gt;</code> for the key this deployment was
                    configured with.
                    <a
                        href={MCP_README}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-dark-accent no-underline"
                    >
                        How to run
                        <ExternalLink size={12} aria-hidden />
                    </a>
                </p>
            )}
            <p className="m-0 text-sm leading-5 text-heavy-metal-300">
                {isRestricted ? (active.restrictedWhere ?? active.where) : active.where}
            </p>
            <CodeCard
                code={active.snippet(origin, isRestricted)}
                header={<CardTabs items={SETUP_CLIENTS} onChange={setClient} value={client} />}
            />
            <p className="m-0 flex w-full items-start gap-2.5 text-sm leading-5 text-heavy-metal-300">
                <Check size={14} aria-hidden className="mt-1 shrink-0 text-dark-accent" />
                {active.verify}
            </p>
        </>
    );
}
