import { cn } from '@shared/utils';
import React from 'react';

type OverlayProps = {
    show: boolean;
};

export function Overlay({ show }: OverlayProps) {
    return (
        <div
            className={cn(
                'e-fixed e-left-0 e-top-0 e-z-[1050] e-h-screen e-w-screen e-bg-dk-black e-transition-opacity e-duration-150 e-ease-linear',
                show ? 'e-opacity-50 e-pointer-events-auto' : 'e-opacity-0 e-pointer-events-none',
            )}
        ></div>
    );
}
