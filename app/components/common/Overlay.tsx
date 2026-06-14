import { cn } from '@shared/utils';
import React from 'react';

type OverlayProps = {
    show: boolean;
};

export function Overlay({ show }: OverlayProps) {
    return <div className={cn('e-modal-backdrop', show && 'e-show')}></div>;
}
