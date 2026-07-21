import type { SupportedCluster } from './config.js';
import type { InspectorLogger } from './logger.js';
import type { DecodeInstructionFallback } from './solana/types.js';

export type EntityInspectorConfig = {
    // Host-app instruction decoder tried after the package's built-in decoders, before raw fallback.
    decodeInstructionFallback?: DecodeInstructionFallback;
    logger?: InspectorLogger;
    // Program label lookup injected by the host app (its curated registry); labels are omitted when absent.
    resolveProgramName?: (address: string) => string | undefined;
    rpcEndpoints: Record<SupportedCluster, string>;
};
