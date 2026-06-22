// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'react-feather';
import { toast as sonnerToast } from 'sonner';

import { cn } from '../../utils';

export interface CustomToastProps {
    id: string | number;
    title: string;
    description?: string | React.ReactNode;
    type: 'success' | 'error' | 'info';
}

export function CustomToast(props: CustomToastProps) {
    const { title, description, id, type } = props;

    const icon = (() => {
        switch (type) {
            case 'success':
                return <CheckCircle className="text-green-400" size={12} aria-hidden="true" />;
            case 'error':
                return <AlertCircle className="text-destructive" size={12} aria-hidden="true" />;
            case 'info':
                return <Info className="text-green-400" size={12} aria-hidden="true" />;
        }
    })();

    const role = type === 'error' ? 'alert' : 'status';
    const ariaLive = type === 'error' ? 'assertive' : 'polite';
    const titleId = `toast-title-${id}`;
    const descriptionId = `toast-description-${id}`;

    return (
        <div
            role={role}
            aria-live={ariaLive}
            aria-atomic="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={cn(
                'w-full rounded-lg border border-transparent bg-neutral-800 text-white shadow-lg',
                'md:max-w-80',
            )}
        >
            <div className="relative flex flex-1 items-start gap-2 p-4">
                <div className="text-xs" aria-hidden="true">
                    {icon}
                </div>
                <div>
                    <p id={titleId} className="mb-0 pr-3 text-sm font-medium">
                        {title}
                    </p>
                    {typeof description === 'string' ? (
                        <p id={descriptionId} className="mb-0 mt-1 text-xs">
                            {description}
                        </p>
                    ) : (
                        description && (
                            <div id={descriptionId} className="mt-1">
                                {description}
                            </div>
                        )
                    )}
                </div>
                <button
                    type="button"
                    aria-label={`Dismiss ${title} notification`}
                    className={cn(
                        'absolute right-4 top-2 flex items-center justify-center',
                        'rounded-sm border-0 bg-transparent p-0 text-neutral-500 opacity-70',
                        'transition-opacity hover:opacity-100',
                        'focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300',
                    )}
                    onClick={() => sonnerToast.dismiss(id)}
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
