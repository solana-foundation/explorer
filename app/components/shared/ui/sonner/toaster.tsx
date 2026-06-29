// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { Toaster as Sonner, ToasterProps } from 'sonner';

import { cn } from '@/app/components/shared/utils';

type Props = ToasterProps;

export const Toaster = ({ toastOptions, ...props }: Props) => {
    return (
        <Sonner
            className="toaster group"
            toastOptions={{
                className: cn(
                    '!px-4 !py-2',
                    'data-[type=success]:!bg-accent-secondary data-[type=success]:!border-accent-secondary data-[type=success]:!text-foreground',
                    'data-[type=error]:!bg-destructive data-[type=error]:!border-destructive data-[type=error]:!text-foreground',
                ),
                classNames: { description: '!text-neutral-400' },
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
