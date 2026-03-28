import type { Options } from '@sentry/core';
import type { SentryBuildOptions } from '@sentry/nextjs';

// Import the actual implementations from the .mjs file
import {
    createSentryBuildConfig as createSentryBuildConfigMjs,
    createSentryConfig as createSentryConfigMjs,
} from './config.mjs';

type RuntimeContext = 'client' | 'server' | 'edge';

/**
 * Type-safe wrapper for the Sentry configuration
 */
export const createSentryConfig = createSentryConfigMjs as (context: RuntimeContext) => Options;

/**
 * Type-safe wrapper for the Sentry build configuration
 */
export const createSentryBuildConfig = createSentryBuildConfigMjs as () => SentryBuildOptions;
