'use client';

import dynamic from 'next/dynamic';
import { ComponentProps, useMemo } from 'react';

import { withStringsInsteadOfBigInts } from '@/app/shared/lib/bigint-to-string';
import { JsonView } from '@/app/shared/ui/json-view';

// Dynamically import @microlink/react-json-view with SSR disabled
const ReactJsonView = dynamic(() => import('@microlink/react-json-view'), {
    loading: () => <div className="text-dk-gray-700">Loading JSON viewer...</div>,
    ssr: false,
});

type ReactJsonViewProps = ComponentProps<typeof ReactJsonView>;

// `v1` (default) is react-json-view and takes its props; `v2` is the design-system tree.
export type JsonViewerProps =
    ({ version?: 'v1' } & ReactJsonViewProps) | { version: 'v2'; src: object; blockCopy?: boolean };

export function JsonViewer(props: JsonViewerProps) {
    return props.version === 'v2' ? (
        <JsonView src={props.src} blockCopy={props.blockCopy} />
    ) : (
        <ReactJsonViewer {...props} />
    );
}

/**
 * Pre-configured JsonViewer with the solarized theme
 * commonly used across the application
 */
export function SolarizedJsonViewer(props: Omit<ReactJsonViewProps, 'theme'>) {
    return <JsonViewer theme="solarized" {...props} />;
}

/**
 * A wrapper component for react-json-view that handles SSR properly.
 * This prevents the "document is not defined" error during server-side rendering.
 */
function ReactJsonViewer({ src, version: _version, ...props }: { version?: 'v1' } & ReactJsonViewProps) {
    const safeSrc = useMemo(() => withStringsInsteadOfBigInts(src) as ReactJsonViewProps['src'], [src]);
    return <ReactJsonView src={safeSrc} {...props} />;
}
