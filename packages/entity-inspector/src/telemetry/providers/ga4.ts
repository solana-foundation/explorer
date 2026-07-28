import type { TelemetryProvider } from '../server.js';

const GA4_COLLECT_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export type Ga4ProviderOptions = {
    measurementId: string;
    apiSecret: string;
};

/** GA4 Measurement Protocol provider — `context.clientId` becomes the GA4 `client_id`. */
export function createGa4Provider(options: Ga4ProviderOptions): TelemetryProvider {
    const query = new URLSearchParams({ api_secret: options.apiSecret, measurement_id: options.measurementId });
    const url = `${GA4_COLLECT_ENDPOINT}?${query.toString()}`;
    return {
        name: 'ga4',
        async send(event, context) {
            const response = await fetch(url, {
                body: JSON.stringify({
                    client_id: context.clientId,
                    events: [{ name: event.name, params: event.params }],
                }),
                headers: { 'content-type': 'application/json' },
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`GA4 collect responded with HTTP ${response.status}`);
            }
        },
    };
}
