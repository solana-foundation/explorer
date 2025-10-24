import { ClientOptions } from '@sentry/core';
import { SentryBuildOptions } from '@sentry/nextjs';

// Import the actual implementations from the .mjs file
import {
    createSentryBuildConfig as createSentryBuildConfigMjs,
    createSentryConfig as createSentryConfigMjs,
} from './config.mjs';

type RuntimeContext = 'client' | 'server' | 'edge';

// Extend ClientOptions to include telemetry option
interface SentryConfig extends Partial<ClientOptions> {
    telemetry?: boolean;
}

/**
 * Type-safe wrapper for the Sentry configuration
 */
export const createSentryConfig = createSentryConfigMjs as (context: RuntimeContext) => SentryConfig;

/**
 * Type-safe wrapper for the Sentry build configuration
 */
export const createSentryBuildConfig = createSentryBuildConfigMjs as () => Partial<SentryBuildOptions>;
