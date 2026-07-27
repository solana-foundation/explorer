// Usage-event fan-out over pluggable providers. The MCP core never imports this entry — hosts
// bind `createTelemetry(...).track` to `EntityInspectorConfig.track` themselves.
import { consoleLogger, type InspectorLogger, ns } from '../logger.js';

export type TelemetryEvent = { name: string; params: Record<string, unknown> };

export type TelemetryContext = { clientId: string };

export type TelemetryProvider = {
    name: string;
    send: (event: TelemetryEvent, context: TelemetryContext) => Promise<void>;
};

export type Telemetry = {
    /** Fire-and-forget: never throws, never rejects — one failing provider does not affect the rest. */
    track: (event: TelemetryEvent, context: TelemetryContext) => void;
};

export type TelemetryOptions = {
    logger?: InspectorLogger;
};

export function createTelemetry(providers: readonly TelemetryProvider[], options: TelemetryOptions = {}): Telemetry {
    const logger = options.logger ?? consoleLogger;
    return {
        track(event, context) {
            for (const provider of providers) {
                // Promise.resolve().then guards synchronous throws from send as well.
                Promise.resolve()
                    .then(() => provider.send(event, context))
                    .catch((error: unknown) => {
                        logger.debug(ns(`telemetry provider ${provider.name} failed`), {
                            error,
                            event: event.name,
                        });
                    });
            }
        },
    };
}
