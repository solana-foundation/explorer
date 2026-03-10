/**
 * Production error monitoring and tracing via Sentry.
 *
 * Project-specific Sentry wrappers. `captureException` and `captureMessage`
 * are intentionally not re-exported — use the Logger instead:
 * - `Logger.panic(msg, { error })` for exceptions
 * - `Logger.error(msg, { sentry: true })` or `Logger.warn(msg, { sentry: true })` for notable events
 */
export { addBreadcrumb, startSpan, setTag, setExtra, setContext, withScope } from '@sentry/nextjs';
export { withTraceData } from './trace-data';
export { SentryErrorBoundary } from './SentryErrorBoundary';
