'use client';

import { useState } from 'react';
import { Check } from 'react-feather';

import { SETUP_CLIENTS } from '../lib/setup-clients';
import { CardTabs } from './CardTabs';
import { CodeCard } from './CodeCard';
import { BandIntro } from './NumberedBand';

export function Setup({ origin }: { origin: string }) {
    const [client, setClient] = useState(SETUP_CLIENTS[0].id);
    const active = SETUP_CLIENTS.find(candidate => candidate.id === client) ?? SETUP_CLIENTS[0];

    return (
        <>
            <BandIntro title="Pick your client, paste one line">
                Pick your tool, copy the config — snippets already point at this deployment. No API key needed.
            </BandIntro>
            <CodeCard
                code={active.snippet(origin)}
                header={<CardTabs items={SETUP_CLIENTS} onChange={setClient} value={client} />}
            />
            <p className="m-0 flex w-full items-start gap-2.5 text-sm leading-5 text-heavy-metal-300">
                <Check size={14} aria-hidden className="mt-1 shrink-0 text-dark-accent" />
                {active.verify}
            </p>
        </>
    );
}
