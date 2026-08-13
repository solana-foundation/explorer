import type { ReactNode } from 'react';

import { MCP_ENABLED_CLUSTER_NAMES } from '@/app/shared/config/mcp-clusters';
import { BaseCard } from '@/app/shared/ui/Card';

import { MCP_ENDPOINT_URL } from '../model/constants';
import { McpStatusIndicator } from './McpStatusIndicator';

function Stat({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
    return (
        <div className={className}>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
            <dd className="m-0 mt-1.5 text-sm text-neutral-200">{children}</dd>
        </div>
    );
}

export function McpStatusSection() {
    return (
        <BaseCard variant="tight">
            <dl className="m-0 grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Status">
                    <McpStatusIndicator />
                </Stat>
                <Stat label="Endpoint" className="lg:col-span-3">
                    {/* Not accent-coloured: the global link colour is nearly the same green, and this URL is not clickable. */}
                    <code className="bg-transparent p-0 font-mono text-sm text-neutral-100">{MCP_ENDPOINT_URL}</code>
                </Stat>
                <Stat label="Transport">Streamable HTTP</Stat>
                <Stat label="Authentication">Open — no key required</Stat>
                <Stat label="Clusters" className="lg:col-span-2">
                    {MCP_ENABLED_CLUSTER_NAMES.join(', ')}
                </Stat>
            </dl>
        </BaseCard>
    );
}
