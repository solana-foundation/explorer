import { EXPLORER_BASE_URL, isEnvEnabled } from '@utils/env';

export const isClusterProbeEnabled = isEnvEnabled(process.env.TX_CLUSTER_PROBE_ENABLED);

export const TX_OG_BASE_URL = EXPLORER_BASE_URL;
