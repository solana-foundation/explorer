import React from 'react';

import { cn } from '@/app/components/shared/utils';

import { LABEL_FONT, LABEL_SHIM, type LabelSize, type LineBox } from './tokens';

/**
 * The "key" in a key-value pair. Owns its baseline shim: renders at a dk font size
 * (`size`) but pads itself to fill a standardized line-box height (`lineBox`) and drop
 * its baseline onto that line-box's shared baseline — so it sits on the grid whether
 * it's inside a `KeyValue` (flex baseline row) or dropped standalone next to body text.
 *
 * Children may be plain text or a small interactive element (link/tooltip label); those
 * inherit the font size + baseline box and bring their own color.
 */
export function Label({
    size = 'm',
    lineBox = 24,
    className,
    children,
}: {
    size?: LabelSize;
    lineBox?: LineBox;
    className?: string;
    children: React.ReactNode;
}) {
    const { fontSize, lineHeight } = LABEL_FONT[size];
    // xl has no line-box 20 (unsupported); fall back to no shim if an unsupported combo is requested.
    const [paddingTop, paddingBottom] = LABEL_SHIM[size][lineBox] ?? [0, 0];

    return (
        <div
            className={cn('min-w-0', 'text-outer-space-300', className)}
            style={{
                fontSize,
                // Wrap a too-long key onto multiple lines: hyphenate per the document's
                // language rules first (`hyphens: auto` uses the inherited `lang`), and fall
                // back to breaking an unbreakable run so it never overflows the label column.
                hyphens: 'auto',
                lineHeight: `${lineHeight}px`,
                overflowWrap: 'break-word',
                paddingBottom,
                paddingTop,
            }}
        >
            {children}
        </div>
    );
}
