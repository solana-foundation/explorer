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
                'e-w-full e-rounded-lg e-border e-border-neutral-950 e-bg-neutral-800 e-text-white',
                'md:e-max-w-80'
            )}
        >
            <div className="e-relative e-flex e-flex-1 e-items-start e-gap-2 e-px-3 e-py-2">
                <div className="e-text-xs" aria-hidden="true">
                    {icon}
                </div>
                <div>
                    <p id={titleId} className="mb-0 e-pr-3 e-text-sm e-font-medium">
                        {title}
                    </p>
                    {typeof description === 'string' ? (
                        <p id={descriptionId} className="mb-0 e-mt-1 e-text-xs">
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
                <div className="e-absolute e-right-0 e-top-0 e-h-6 e-w-6">
                    <button
                        type="button"
                        aria-label={`Dismiss ${title} notification`}
                        className={cn(
                            'e-h-full e-w-full e-rounded e-border-0 e-border-solid e-bg-transparent e-p-0',
                            'e-text-neutral-400 hover:e-text-neutral-500',
                            'focus:e-outline-none focus:e-ring-2 focus:e-ring-neutral-400 focus:e-ring-offset-2'
                        )}
                        onClick={() => sonnerToast.dismiss(id)}
                    >
                        <X size={12} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
