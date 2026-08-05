// Usage-event fan-out over pluggable providers — kept import-free from the MCP core; hosts adapt `track` into `EntityInspectorConfig.track` themselves (supplying the context).
import { consoleLogger, type InspectorLogger, ns } from '../logger.js';

// Scalar-only params: GA4's Measurement Protocol silently discards nested values.
export type TelemetryEvent = { name: string; params: Record<string, string | number | boolean> };

export type TelemetryContext = { clientId: string };

export type TelemetryProvider = {
    name: string;
    send: (event: TelemetryEvent, context: TelemetryContext) => Promise<void>;
};

export type Telemetry = {
    /** Always resolves, never throws — one failing provider does not affect the rest. Await it where the platform must stay alive until delivery (e.g. inside Next `after()`). */
    track: (event: TelemetryEvent, context: TelemetryContext) => Promise<void>;
};

export type TelemetryOptions = {
    logger?: InspectorLogger;
};

export function createTelemetry(providers: readonly TelemetryProvider[], options: TelemetryOptions = {}): Telemetry {
    const logger = options.logger ?? consoleLogger;
    return {
        async track(event, context) {
            await Promise.all(
                providers.map(provider =>
                    // Promise.resolve().then guards synchronous throws from send as well.
                    Promise.resolve()
                        .then(() => provider.send(event, context))
                        .catch((error: unknown) => {
                            // warn, not debug: this line is the only signal for a persistently broken provider (e.g. a bad GA secret).
                            logger.warn(ns(`telemetry provider ${provider.name} failed`), {
                                error,
                                event: event.name,
                            });
                        }),
                ),
            );
        },
    };
}
