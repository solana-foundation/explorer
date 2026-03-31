import { EXPLORER_BASE_URL, isEnvEnabled } from '@utils/env';

export function isFeatureGateOgEnabled() {
    return isEnvEnabled(process.env.FEATURE_GATE_OG_ENABLED);
}

// Empty string is valid (relative URLs), only undefined falls back to EXPLORER_BASE_URL
export const FEATURE_GATE_BASE_URL =
    process.env.FEATURE_GATE_BASE_URL !== undefined ? process.env.FEATURE_GATE_BASE_URL.trim() : EXPLORER_BASE_URL;
