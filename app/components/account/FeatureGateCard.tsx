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
            {/* Surface matched to `BaseDomainsCard`: `className=""` above leaves the surface to this card.
                BaseCard uses `cnPrefixed` (tailwind-merge), so these override the tw variant's defaults. Below `md`
                the text takes the key-value rows' padding, so it lines up with the Overview card above. */}
            <Card
                variant="tight"
                className={`rounded-lg border-outer-space-800 bg-outer-space-900 ${ROW_PADDING} md:p-6`}
            >
                {children}
            </Card>
        </CollapsibleSection>
    );
}
