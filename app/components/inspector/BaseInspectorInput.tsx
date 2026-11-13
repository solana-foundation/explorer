import { cva } from 'class-variance-authority';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { cn } from '@/app/components/shared/utils';
import { NormalizedAlertCircle } from '@/app/shared/ui/icons/normalized';

export const INSPECTOR_INPUT_LABEL = 'Inspector input';

const textareaVariants = cva(
    [
        'block min-h-[126px] w-full resize-none rounded-lg border border-solid bg-heavy-metal-900 px-4 py-3',
        'font-mono text-sm text-white placeholder:text-outer-space-300',
        'focus:outline-none focus-visible:outline-none',
    ],
    {
        defaultVariants: { invalid: false },
        variants: {
            invalid: {
                false: 'border-outer-space-800 focus:border-accent',
                true: 'border-destructive',
            },
        },
    },
);

export type BaseInspectorInputProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'aria-label'> & {
    error?: string;
    hasValue: boolean;
    onClear: () => void;
};

export const BaseInspectorInput = React.forwardRef<HTMLTextAreaElement, BaseInspectorInputProps>(
    ({ error, hasValue, onClear, className, ...props }, ref) => (
        <div className="flex flex-col gap-2">
            <textarea
                ref={ref}
                aria-label={INSPECTOR_INPUT_LABEL}
                aria-invalid={error ? true : undefined}
                className={cn(textareaVariants({ invalid: Boolean(error) }), className)}
                {...props}
            />
            {(error || hasValue) && (
                <div className="flex items-start justify-between gap-3">
                    {error ? (
                        <div className="flex items-start gap-1.5 text-sm leading-5 text-destructive" role="alert">
                            <NormalizedAlertCircle className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <span />
                    )}
                    {hasValue && (
                        <Button variant="outline" size="sm" type="button" onClick={onClear} className="shrink-0">
                            Clear
                        </Button>
                    )}
                </div>
            )}
        </div>
    ),
);
BaseInspectorInput.displayName = 'BaseInspectorInput';
