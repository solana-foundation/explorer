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
                return <CheckCircle className="e-text-green-400" size={12} aria-hidden="true" />;
            case 'error':
                return <AlertCircle className="e-text-destructive" size={12} aria-hidden="true" />;
            case 'info':
                return <Info className="e-text-green-400" size={12} aria-hidden="true" />;
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
                'e-w-full e-rounded-lg e-border e-border-transparent e-bg-neutral-800 e-text-white e-shadow-lg',
                'md:e-max-w-80',
            )}
        >
            <div className="e-relative e-flex e-flex-1 e-items-start e-gap-2 e-p-4">
                <div className="e-text-xs" aria-hidden="true">
                    {icon}
                </div>
                <div>
                    <p id={titleId} className="e-mb-0 e-pr-3 e-text-sm e-font-medium">
                        {title}
                    </p>
                    {typeof description === 'string' ? (
                        <p id={descriptionId} className="e-mb-0 e-mt-1 e-text-xs">
                            {description}
                        </p>
                    ) : (
                        description && (
                            <div id={descriptionId} className="e-mt-1">
                                {description}
                            </div>
                        )
                    )}
                </div>
                <button
                    type="button"
                    aria-label={`Dismiss ${title} notification`}
                    className={cn(
                        'e-absolute e-right-4 e-top-2 e-flex e-items-center e-justify-center',
                        'e-rounded-sm e-border-0 e-bg-transparent e-p-0 e-text-neutral-500 e-opacity-70',
                        'e-transition-opacity hover:e-opacity-100',
                        'focus:e-outline-none focus-visible:e-ring-1 focus-visible:e-ring-neutral-300',
                    )}
                    onClick={() => sonnerToast.dismiss(id)}
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
