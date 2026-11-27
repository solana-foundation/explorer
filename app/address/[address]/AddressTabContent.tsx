import type { ReactNode } from 'react';

// `display: contents` gives the tab no rectangle, so Next.js's post-navigation scroll targets the address layout
// (opening at the page top) instead of the tab below the header. The margins match the old `PageSections` spacing.
export function AddressTabContent({ children }: { children: ReactNode }) {
    return (
        <div className="contents [&>:not([hidden])]:mb-0 [&>:not([hidden])]:mt-9 lg:[&>:not([hidden])]:mt-12">
            {children}
        </div>
    );
}
