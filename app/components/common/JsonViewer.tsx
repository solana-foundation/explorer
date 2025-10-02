'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import react-json-view with SSR disabled
const ReactJsonView = dynamic(() => import('react-json-view'), {
    loading: () => <div className="text-muted">Loading JSON viewer...</div>,
    ssr: false,
});

export type JsonViewerProps = ComponentProps<typeof ReactJsonView>;

/**
 * A wrapper component for react-json-view that handles SSR properly.
 * This prevents the "document is not defined" error during server-side rendering.
 */
export function JsonViewer(props: JsonViewerProps) {
    return <ReactJsonView {...props} />;
}

/**
 * Pre-configured JsonViewer with the solarized theme
 * commonly used across the application
 */
export function SolarizedJsonViewer(props: Omit<JsonViewerProps, 'theme'>) {
    return <JsonViewer theme="solarized" {...props} />;
}
