import type { SupportedCluster } from './config.js';
import type { InspectorLogger } from './logger.js';

export type EntityInspectorConfig = {
    logger?: InspectorLogger;
    // Scaffolding for the inspect_entity tool (plan Steps 5/6); not read yet — only ping ships today.
    rpcEndpoints: Record<SupportedCluster, string>;
};
