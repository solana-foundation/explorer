import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import type { McpAnalyticsEvent } from '../../types.js';
import { createTelemetry, type TelemetryEvent, type TelemetryProvider } from '../server.js';

const EVENT = { name: 'mcp_tool_call', params: { tool: 'ping' } };
const CONTEXT = { clientId: 'client-1' };

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe('createTelemetry', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should fan an event out to every provider and resolve once all sends settle', async () => {
        const first: TelemetryProvider = { name: 'first', send: vi.fn().mockResolvedValue(undefined) };
        const second: TelemetryProvider = { name: 'second', send: vi.fn().mockResolvedValue(undefined) };
        const telemetry = createTelemetry([first, second], { logger: createLoggerMock() });

        await expect(telemetry.track(EVENT, CONTEXT)).resolves.toBeUndefined();

        expect(first.send).toHaveBeenCalledWith(EVENT, CONTEXT);
        expect(second.send).toHaveBeenCalledWith(EVENT, CONTEXT);
    });

    it('should isolate a rejecting provider, resolve anyway, and log the failure at warn', async () => {
        const logger = createLoggerMock();
        const failing: TelemetryProvider = { name: 'ga4', send: vi.fn().mockRejectedValue(new Error('boom')) };
        const healthy: TelemetryProvider = { name: 'other', send: vi.fn().mockResolvedValue(undefined) };
        const telemetry = createTelemetry([failing, healthy], { logger });

        await expect(telemetry.track(EVENT, CONTEXT)).resolves.toBeUndefined();

        expect(healthy.send).toHaveBeenCalledWith(EVENT, CONTEXT);
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] telemetry provider ga4 failed', {
            error: new Error('boom'),
            event: 'mcp_tool_call',
        });
    });

    it('should guard a provider that throws synchronously', async () => {
        const logger = createLoggerMock();
        const throwing: TelemetryProvider = {
            name: 'sync',
            send: () => {
                throw new Error('sync boom');
            },
        };
        const telemetry = createTelemetry([throwing], { logger });

        await expect(telemetry.track(EVENT, CONTEXT)).resolves.toBeUndefined();

        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] telemetry provider sync failed', {
            error: new Error('sync boom'),
            event: 'mcp_tool_call',
        });
    });

    it('should log through the console logger when none is injected', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const failing: TelemetryProvider = { name: 'ga4', send: vi.fn().mockRejectedValue(new Error('boom')) };
        const telemetry = createTelemetry([failing]);

        await telemetry.track(EVENT, CONTEXT);

        expect(warnSpy).toHaveBeenCalledWith('[entity-inspector] telemetry provider ga4 failed', {
            error: new Error('boom'),
            event: 'mcp_tool_call',
        });
    });

    it('should resolve without logging when the provider list is empty', async () => {
        const logger = createLoggerMock();
        const telemetry = createTelemetry([], { logger });

        await expect(telemetry.track(EVENT, CONTEXT)).resolves.toBeUndefined();

        expect(logger.warn).not.toHaveBeenCalled();
    });

    // The core never imports this entry — the bridge is structural; this pins it in package CI.
    it('should accept every MCP analytics event as a telemetry event', () => {
        expectTypeOf<McpAnalyticsEvent>().toExtend<TelemetryEvent>();
    });
});
