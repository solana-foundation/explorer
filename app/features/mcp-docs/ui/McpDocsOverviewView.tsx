'use client';

import { useEffect, useState } from 'react';

import { type EndpointStatus, SECTIONS } from '../lib/mcp-docs-layout';
import { useDeploymentOrigin } from '../lib/useDeploymentOrigin';
import { ClosingCta } from './ClosingCta';
import { Examples } from './Examples';
import { Hero } from './Hero';
import { Instructions } from './Instructions';
import { NumberedBand } from './NumberedBand';
import { SectionTabs } from './SectionTabs';
import { Setup } from './Setup';
import { Tools } from './Tools';

export function McpDocsOverviewView() {
    const origin = useDeploymentOrigin();
    const [status, setStatus] = useState<EndpointStatus>({ state: 'checking' });

    useEffect(() => {
        const started = performance.now();
        fetch('/mcp')
            .then(response =>
                setStatus({
                    ms: Math.round(performance.now() - started),
                    state: response.status === 503 ? 'disabled' : 'ready',
                }),
            )
            .catch(() => setStatus({ state: 'disabled' }));
    }, []);

    return (
        <div
            className="w-full bg-heavy-metal-950 text-dark-foreground"
            style={{
                backgroundImage: 'radial-gradient(ellipse 55% 17% at 12% 4%, #1DD79B26 0%, #1DD79B00 100%)',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <Hero status={status} origin={origin} />
            <SectionTabs />
            <NumberedBand section={SECTIONS[0]} flushTop>
                <Setup origin={origin} />
            </NumberedBand>
            <NumberedBand section={SECTIONS[1]}>
                <Instructions />
            </NumberedBand>
            <NumberedBand section={SECTIONS[2]}>
                <Tools />
            </NumberedBand>
            <NumberedBand section={SECTIONS[3]}>
                <Examples />
            </NumberedBand>
            <ClosingCta />
        </div>
    );
}
