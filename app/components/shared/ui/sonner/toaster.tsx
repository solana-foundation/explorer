import { Toaster as Sonner, ToasterProps } from 'sonner';

import { cn } from '@/app/components/shared/utils';

type Props = ToasterProps;

export const Toaster = ({ toastOptions, ...props }: Props) => {
    return (
        <Sonner
            className="toaster group"
            toastOptions={{
                className: cn(
                    '!e-px-4 !e-py-2',
                    'data-[type=success]:!e-bg-accent-secondary data-[type=success]:!e-border-accent-secondary data-[type=success]:!e-text-foreground',
                    'data-[type=error]:!e-bg-destructive data-[type=error]:!e-border-destructive data-[type=error]:!e-text-foreground',
                ),
                classNames: { description: '!e-text-neutral-400' },
                ...toastOptions,
            }}
            style={
                {
                    '--normal-bg': 'oklch(0.205 0 0)',
                    '--normal-border': 'var(--border)',
                    '--normal-text': 'oklch(0.985 0 0)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
};
