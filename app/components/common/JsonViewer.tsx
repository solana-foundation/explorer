'use client';

import dynamic from 'next/dynamic';
import { ComponentProps, useMemo } from 'react';

// Dynamically import @microlink/react-json-view with SSR disabled
const ReactJsonView = dynamic(() => import('@microlink/react-json-view'), {
    loading: () => <div className="text-dk-gray-700">Loading JSON viewer...</div>,
    ssr: false,
});

export type JsonViewerProps = ComponentProps<typeof ReactJsonView>;

/**
 * react-json-view serializes values with JSON.stringify, which throws on bigints. Decoded
 * on-chain data (borsh u64/u128 fields and friends) routinely contains them, so replace every
 * bigint with its decimal string before handing the tree to the viewer. Only plain objects and
 * arrays are traversed; anything else (Uint8Array, Map, class instances) is passed through
 * unchanged. Already-visited nodes are also passed through, because react-json-view renders
 * circular references itself and an unguarded recursion would overflow the stack first.
 */
function withStringsInsteadOfBigInts(value: unknown, seen = new WeakSet<object>()): unknown {
    if (typeof value === 'bigint') {
        return String(value);
    }
    if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return value;
        seen.add(value);
    }
    if (Array.isArray(value)) {
        return value.map(item => withStringsInsteadOfBigInts(item, seen));
    }
    if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, withStringsInsteadOfBigInts(item, seen)]),
        );
    }
    return value;
}

/**
 * A wrapper component for react-json-view that handles SSR properly.
 * This prevents the "document is not defined" error during server-side rendering.
 */
export function JsonViewer({ src, ...props }: JsonViewerProps) {
    const safeSrc = useMemo(() => withStringsInsteadOfBigInts(src) as JsonViewerProps['src'], [src]);
    return <ReactJsonView src={safeSrc} {...props} />;
}

/**
 * Pre-configured JsonViewer with the solarized theme
 * commonly used across the application
 */
export function SolarizedJsonViewer(props: Omit<JsonViewerProps, 'theme'>) {
    return <JsonViewer theme="solarized" {...props} />;
}
