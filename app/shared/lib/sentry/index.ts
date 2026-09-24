/**
 * Production error monitoring and tracing via Sentry.
 *
 * Project-specific Sentry wrappers. `captureException` and `captureMessage`
 * are intentionally not re-exported — use the Logger instead:
 * - `Logger.panic(error)` for exceptions
 * - `Logger.error(msg, { sentry: true })` or `Logger.warn(msg, { sentry: true })` for notable events
 */
// Server and client code both import this module, so it must export only what every build of
// @sentry/nextjs has.
export { addBreadcrumb, captureFeedback, startSpan, setTag, setExtra, setContext, withScope } from '@sentry/nextjs';
export { withTraceData } from './trace-data';
export { SentryErrorBoundary } from './SentryErrorBoundary';
