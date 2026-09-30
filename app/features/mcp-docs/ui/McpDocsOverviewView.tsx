'use client';

import { useEffect, useState } from 'react';

import { EndpointState, type EndpointStatus, SECTIONS } from '../lib/mcp-docs-layout';
import { useDeploymentOrigin } from '../lib/useDeploymentOrigin';
import { ClosingCta } from './ClosingCta';
import { Examples } from './Examples';
import { Hero } from './Hero';
import { Instructions } from './Instructions';
import { NumberedBand } from './NumberedBand';
import { SectionTabs } from './SectionTabs';
import { Setup } from './Setup';
import { Tools } from './Tools';

function probeState(status: number): EndpointState {
    if (status >= 500) return EndpointState.Disabled;
    if (status === 403) return EndpointState.Blocked;
    if (status === 401) return EndpointState.Restricted;
    return EndpointState.Ready;
}

export function McpDocsOverviewView() {
    const origin = useDeploymentOrigin();
    const [status, setStatus] = useState<EndpointStatus>({ state: EndpointState.Checking });

    useEffect(() => {
        const started = performance.now();
        fetch('/mcp')
            .then(response =>
                setStatus({
                    ms: Math.round(performance.now() - started),
                    state: probeState(response.status),
                }),
            )
            .catch(() => setStatus({ state: EndpointState.Disabled }));
    }, []);

    const isRestricted = status.state === EndpointState.Restricted;

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
                <Setup origin={origin} isRestricted={isRestricted} />
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
