import React from 'react';

import { Card, CardTitle } from '@/app/shared/ui/Card';

/**
 * The Overview-card treatment shared by every program-account tab card, lifted from
 * `UpgradeableProgramSection` (BaseAccountCard's `headerOutside` branch): the title —
 * plus any header actions — sits on the page background above the card, and the card
 * body is a single `overflow-x-clip` / `min-w-0` column so an unwrappable value
 * (address, hash, verify command) is clipped at the block edge instead of spilling
 * past the rounded border or turning the row into a horizontal scroll container.
 *
 * Unlike BaseAccountCard this drops the Raw toggle + download/refresh actions that only
 * make sense for a full Account — the tab cards render presentational data, so they get
 * the same frame without the account chrome.
 */
export function SectionCard({
    title,
    headerActions,
    note,
    noCardMargin,
    children,
}: {
    title: React.ReactNode;
    /** Rendered to the right of the title in the outside header (e.g. a badge or Download button). */
    headerActions?: React.ReactNode;
    /**
     * Optional standalone note (e.g. an `Alert`) rendered in the gap between the outside
     * header and the card — the treatment for the Security.txt caveat.
     */
    note?: React.ReactNode;
    /**
     * Drop the Card's built-in `mb-6` so the caller can control the gap to whatever it
     * renders directly below the card. Applied as `!mb-0` because a non-important `mb-0`
     * would lose the source-order tie and leave the 24px margin in place.
     */
    noCardMargin?: boolean;
    children: React.ReactNode;
}) {
    return (
        <>
            {/* min-h-[1.75rem] matches the Transaction History card's external header: a title-only
                header is centered in the same 28px box, so the space above and below the title — and
                thus the gap to the card — lines up across all tabs. */}
            <div className="mb-3 flex min-h-[1.75rem] items-center gap-2">
                <CardTitle as="h3" ui="dashkit" className="flex flex-1 items-center gap-2">
                    {title}
                </CardTitle>
                {headerActions}
            </div>
            {note && <div className="mb-3">{note}</div>}
            <Card ui="dashkit" className={noCardMargin ? '!mb-0' : undefined}>
                <div className="flex min-w-0 flex-col overflow-x-clip">{children}</div>
            </Card>
        </>
    );
}
