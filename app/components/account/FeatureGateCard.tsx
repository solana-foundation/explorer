'use client';

import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { Card } from '@shared/ui/Card';
import { ROW_PADDING } from '@shared/ui/spacing';
import type { ReactNode } from 'react';

// A client component because `CollapsibleSection` keeps its expanded state in `useState`. The proposal
// markdown stays on the server: `page.tsx` renders it and passes the result in as `children`.
export function FeatureGateCard({ children }: { children: ReactNode }) {
    return (
        // `pb-10`: the room under the page's last block, as the transaction page leaves under its instructions.
        <CollapsibleSection title="Feature Information" className="" sectionClassName="pb-10">
            {/* The surface lives here (the section above passes `className=""`); `ROW_PADDING` below `md` lines the
                proposal up with the Overview card's key-value rows. */}
            <Card
                variant="tight"
                className={`rounded-lg border-outer-space-800 bg-outer-space-900 ${ROW_PADDING} md:p-6`}
            >
                {children}
            </Card>
        </CollapsibleSection>
    );
}
