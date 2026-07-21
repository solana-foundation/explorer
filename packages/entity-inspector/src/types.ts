import type { SupportedCluster } from './config.js';
import type { InspectorLogger } from './logger.js';

export type EntityInspectorConfig = {
    logger?: InspectorLogger;
    // Program label lookup injected by the host app (its curated registry); labels are omitted when absent.
    resolveProgramName?: (address: string) => string | undefined;
    rpcEndpoints: Record<SupportedCluster, string>;
};
