import { cn } from '@shared/utils';
import React from 'react';

type OverlayProps = {
    show: boolean;
};

export function Overlay({ show }: OverlayProps) {
    return <div className={cn('modal-backdrop fade', show ? 'show' : 'disable-pointer-events')}></div>;
}
