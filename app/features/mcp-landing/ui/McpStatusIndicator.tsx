'use client';

import useSWR from 'swr';

import { Badge } from '@/app/components/shared/ui/badge';

import { checkMcpHealth, type McpHealthStatus } from '../model/mcp-health';

type IndicatorState = 'checking' | McpHealthStatus;

const LABEL: Record<IndicatorState, string> = {
    checking: 'Checking',
    disabled: 'Disabled',
    ready: 'Ready',
    unreachable: 'Unreachable',
};

const VARIANT: Record<IndicatorState, 'destructive' | 'info' | 'success' | 'warning'> = {
    checking: 'info',
    disabled: 'warning',
    ready: 'success',
    unreachable: 'destructive',
};

export interface McpStatusIndicatorProps {
    /** Server-rendered MCP_ENDPOINT_ENABLED, so a disabled endpoint reads as such before the first poll. */
    initialEnabled: boolean;
}

export function McpStatusIndicator({ initialEnabled }: McpStatusIndicatorProps) {
    // Infrequent on purpose: every check is a real tool call that lands in MCP usage analytics as non-agent traffic.
    const { data } = useSWR('mcp-health', checkMcpHealth, { refreshInterval: 300_000 });

    // Until the first check lands the env flag can only rule the endpoint out, never confirm it answers.
    const state: IndicatorState = data?.status ?? (initialEnabled ? 'checking' : 'disabled');

    return (
        <span className="flex flex-wrap items-center gap-2">
            <Badge variant={VARIANT[state]}>{LABEL[state]}</Badge>
            {state === 'ready' && data && <span className="text-xs text-neutral-500">{data.latencyMs} ms</span>}
        </span>
    );
}
