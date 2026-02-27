export type EventParams = {
    [key: string]: string | number | boolean | undefined;
};

export type DataLayer = Array<Record<string, unknown>>;

// Type definitions for provider-specific window extensions
export type WindowWithDataLayer = Window & { dataLayer: DataLayer };
export type WindowWithGtag = Window & { gtag: (...args: unknown[]) => void };

/** Checks if string S fits within N characters */
type FitsIn<S extends string, N extends number, Acc extends unknown[] = []> = Acc['length'] extends N
    ? S extends ''
        ? true
        : false
    : S extends `${string}${infer Rest}`
    ? FitsIn<Rest, N, [...Acc, unknown]>
    : true;

/** Resolves to S if within 40 chars, otherwise never */
export type GA4EventName<S extends string> = FitsIn<S, 40> extends true ? S : never;
