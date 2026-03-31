import { isEnvEnabled } from '@utils/env';

export function isFeatureGateOgEnabled() {
    return isEnvEnabled(process.env.FEATURE_GATE_OG_ENABLED);
}
