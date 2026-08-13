'use client';

import useSWR from 'swr';

import { Badge } from '@/app/components/shared/ui/badge';
import { Logger } from '@/app/shared/lib/logger';

import { checkMcpHealth, type McpHealthStatus } from '../model/mcp-health';

type IndicatorState = 'checking' | McpHealthStatus;

const LABEL: Record<IndicatorState, string> = {
    checking: 'Checking',
    degraded: 'Degraded',
    disabled: 'Disabled',
    ready: 'Ready',
    unauthorized: 'Key required',
    unreachable: 'Unreachable',
};

const VARIANT: Record<IndicatorState, 'destructive' | 'info' | 'success' | 'warning'> = {
    checking: 'info',
    degraded: 'destructive',
    disabled: 'warning',
    ready: 'success',
    unauthorized: 'warning',
    unreachable: 'destructive',
};

export function McpStatusIndicator() {
    const { data, error } = useSWR('mcp-health', checkMcpHealth, {
        onError: cause => Logger.error(new Error('MCP health check rejected', { cause }), { sentry: true }),
        // A broken tool contract is our bug, so it is the one status worth an alert.
        onSuccess: health =>
            health.status === 'degraded' &&
            Logger.error(new Error(health.reason, { cause: health.cause }), { sentry: true }),
        // Infrequent on purpose: every check is a real tool call that lands in MCP usage analytics as non-agent traffic.
        // Focus/reconnect revalidation is off for the same reason — it would fire a ping on every tab switch.
        refreshInterval: 300_000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    // The probe never rejects, so `error` only fires if that contract breaks — surface it rather than showing "Checking".
    const state: IndicatorState = data?.status ?? (error ? 'unreachable' : 'checking');
    const detail = data && data.status !== 'ready' ? data.reason : undefined;

    return (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant={VARIANT[state]}>{LABEL[state]}</Badge>
            {data?.status === 'ready' && <span className="text-xs text-neutral-500">{data.latencyMs} ms</span>}
            {detail && <span className="text-xs text-neutral-500">{detail}</span>}
        </span>
    );
}
