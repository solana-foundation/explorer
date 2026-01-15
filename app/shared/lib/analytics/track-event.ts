type EventParams = {
    [key: string]: string | number | boolean | undefined;
};

type DataLayer = Array<Record<string, unknown>>;

// Type definitions for provider-specific window extensions
type WindowWithDataLayer = Window & { dataLayer: DataLayer };
type WindowWithGtag = Window & { gtag: (...args: unknown[]) => void };

function getDataLayer(win: Window): WindowWithDataLayer | undefined {
    if ('dataLayer' in win && Array.isArray((win as WindowWithDataLayer).dataLayer)) {
        return win as WindowWithDataLayer;
    }
    return undefined;
}

function getGtag(win: Window): WindowWithGtag | undefined {
    if (typeof (win as unknown as { gtag?: unknown }).gtag === 'function') {
        return win as WindowWithGtag;
    }
    return undefined;
}

interface AnalyticsProvider {
    canUse(win: Window): boolean;
    track(win: Window, eventName: string, params?: EventParams): void;
}

const dataLayerProvider: AnalyticsProvider = {
    canUse(win: Window): boolean {
        return getDataLayer(win) !== undefined;
    },
    track(win: Window, eventName: string, params?: EventParams): void {
        getDataLayer(win)?.dataLayer.push({ event: eventName, ...params });
    },
};

const gtagProvider: AnalyticsProvider = {
    canUse(win: Window): boolean {
        return getGtag(win) !== undefined;
    },
    track(win: Window, eventName: string, params?: EventParams): void {
        getGtag(win)?.gtag('event', eventName, params);
    },
};

const providers: AnalyticsProvider[] = [dataLayerProvider, gtagProvider];

function resolveProvider(win: Window): AnalyticsProvider | undefined {
    return providers.find(provider => provider.canUse(win));
}

function isAnalyticsEnabled(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim());
}

export function trackEvent(eventName: string, params?: EventParams): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (!isAnalyticsEnabled()) {
        return;
    }

    try {
        const provider = resolveProvider(window);
        provider?.track(window, eventName, params);
    } catch (error) {
        console.error('Analytics error:', error);
    }
}
