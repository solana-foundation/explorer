import type { SupportedCluster } from './config.js';
import type { InspectorLogger } from './logger.js';

export type EntityInspectorConfig = {
    logger?: InspectorLogger;
    rpcEndpoints: Record<SupportedCluster, string>;
};
