import React from 'react';

import { Copyable } from '@/app/components/common/Copyable';

/**
 * Wrapping code block with a trailing copy affordance — the value renderer used by the
 * "Verify Command" row of the VerifiedBuildCard (and any other `DisplayType.LongString`
 * field). A `<pre>` that wraps on word boundaries keeps a long shell command readable
 * instead of overflowing the value column, with the `Copyable` copy glyph pinned inside
 * the box on the right.
 */
export function CopyableCode({ value }: { value: string }) {
    return (
        <div className="flex min-w-0 items-start gap-2 rounded-md border border-solid border-dark-border bg-black/20 px-2 py-1">
            <pre className="mb-0 min-w-0 flex-1 whitespace-pre-wrap break-words bg-transparent font-mono">{value}</pre>
            {/* Copy affordance in its own trailing column, nudged 4px down — text wraps beside it, never under it. */}
            <span className="mt-1 shrink-0">
                <Copyable text={value} />
            </span>
        </div>
    );
}
