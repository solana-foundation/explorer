import { cn } from '@shared/utils';
import React from 'react';

type OverlayProps = {
    show: boolean;
};

export function Overlay({ show }: OverlayProps) {
    return (
        <div
            className={cn(
                'fixed left-0 top-0 z-[1050] h-screen w-screen bg-dk-black transition-opacity duration-150 ease-linear',
                show ? 'pointer-events-auto opacity-50' : 'pointer-events-none opacity-0',
            )}
        ></div>
    );
}
