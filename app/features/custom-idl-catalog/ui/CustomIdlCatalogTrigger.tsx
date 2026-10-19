'use client';

import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';

// The footer is on every page, so the catalog loads only when the user opens it.
const CustomIdlCatalog = dynamic(() => import('./CustomIdlCatalog').then(m => m.CustomIdlCatalog), { ssr: false });

export function CustomIdlCatalogTrigger({ children, className }: { children: ReactNode; className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);
    return (
        <>
            <button
                type="button"
                className={className}
                onClick={() => {
                    setHasOpened(true);
                    setIsOpen(true);
                }}
            >
                {children}
            </button>
            {hasOpened && <CustomIdlCatalog open={isOpen} onOpenChange={setIsOpen} />}
        </>
    );
}
