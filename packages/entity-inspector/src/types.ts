import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { EnabledClusterNames, SupportedCluster } from './config.js';
import type { InspectorLogger } from './logger.js';
import type { DecodeInstructionFallback } from './transactions/types.js';

export type McpToolCallEventParams = {
    tool: string;
    duration_ms: number;
    status: 'success' | 'error';
    cluster?: string;
    entity_kind?: string;
    decode_sources?: string; // Unique instruction decode sources of a transaction, comma-joined (GA4 params are scalars)
    error_code?: string;
};

export type McpAnalyticsEvent =
    | { name: 'mcp_tool_call'; params: McpToolCallEventParams }
    | { name: 'mcp_initialize'; params: Record<string, never> };

export type EntityInspectorConfig = {
    // Host-app instruction decoder tried after the package's built-in decoders, before raw fallback.
    decodeInstructionFallback?: DecodeInstructionFallback;
    /** Clusters the tool advertises and accepts. Defaults to every SUPPORTED_CLUSTERS entry. */
    enabledClusterNames?: EnabledClusterNames;
    logger?: InspectorLogger;
    // Program label lookup injected by the host app (its curated registry); labels are omitted when absent.
    resolveProgramName?: (address: string) => string | undefined;
    rpcEndpoints: Record<SupportedCluster, string>;
    /** Usage-event sink (see `@explorer/entity-inspector/telemetry/server` for a provider-based consumer). */
    track?: (event: McpAnalyticsEvent) => void;
    /** Per-request server decorator — the host app passes e.g. `Sentry.wrapMcpServerWithSentry`. */
    wrapServer?: (server: McpServer) => McpServer;
};
