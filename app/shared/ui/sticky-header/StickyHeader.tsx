'use client';

import React from 'react';

import { cn } from '@/app/components/shared/utils';

type Props = {
    children: React.ReactNode;
    className?: string;
};

export function StickyHeader({ children, className }: Props) {
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = React.useState(false);

    React.useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), { threshold: [1] });
        observer.observe(sentinel);

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div ref={sentinelRef} aria-hidden="true" />
            <div
                className={cn(
                    'bg-body e-sticky e-top-0 e-z-10 e-mb-8 e-border-0 e-border-b e-border-solid e-border-neutral-800',
                    className,
                )}
                style={isStuck ? { marginLeft: 'calc(50% - 50vw)', width: '100vw' } : undefined}
            >
                <div className={cn(!isStuck && '-e-mx-3')}>{children}</div>
            </div>
        </>
    );
}
