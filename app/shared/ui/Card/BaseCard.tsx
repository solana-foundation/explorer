import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// `ui` picks the visual lineage. Default is "tw" since most consumers already use Tailwind — pass ui="dashkit" explicitly when migrating Bootstrap `.card*` callsites; the "dashkit" branch + dk-* tokens get deleted once migration completes.
type UI = 'dashkit' | 'tw';

const BaseCardUIContext = React.createContext<UI>('tw');

const useResolvedUI = (override?: UI | null) => {
    const ctx = React.useContext(BaseCardUIContext);
    return override ?? ctx;
};

const cardVariants = cva(['e-relative e-flex e-min-w-0 e-flex-col e-break-words'], {
    compoundVariants: [
        { class: 'e-px-6 e-py-2.5', ui: 'tw', variant: 'default' },
        { class: 'e-px-3 e-py-2', ui: 'tw', variant: 'narrow' },
        { class: '', ui: 'tw', variant: 'tight' },
    ],
    defaultVariants: { flex: 'default', ui: 'tw', variant: 'default' },
    variants: {
        flex: {
            default: '',
            grow: 'e-flex-1',
        },
        // Override the implicit margin-bottom that `ui="dashkit"` ships with.
        marginBottom: {
            none: 'e-mb-0',
            sm: 'e-mb-2',
        },
        ui: {
            dashkit:
                'e-mb-6 e-rounded-lg e-border e-border-solid e-border-dk-card-outline-dark e-bg-dk-gray-800-dark e-shadow-dk-card',
            tw: 'e-rounded-xl e-border e-border-solid e-border-heavy-metal-950 e-bg-heavy-metal-800 e-text-neutral-200',
        },
        // Card-level padding; only meaningful when ui="tw" (matches the legacy OKLCH Card's `variant` prop).
        // For ui="dashkit", padding lives on <BaseCardBody> per dashkit's `.card-body` convention.
        variant: {
            default: '',
            narrow: '',
            tight: '',
        },
    },
});

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const BaseCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
    ({ className, flex, marginBottom, ui, variant, ...props }, ref) => (
        <BaseCardUIContext.Provider value={ui ?? 'tw'}>
            <div ref={ref} className={cn(cardVariants({ flex, marginBottom, ui, variant }), className)} {...props} />
        </BaseCardUIContext.Provider>
    ),
);
BaseCard.displayName = 'BaseCard';

const headerVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit:
                'e-flex e-h-[60px] e-items-center e-border-0 e-border-b e-border-solid e-border-dark-border e-px-dk-4 e-py-3 [&>:first-child]:e-flex-1',
            tw: 'e-flex e-flex-col e-space-y-1.5 e-p-6',
        },
    },
});

interface UIPropOverride {
    ui?: UI;
}

const BaseCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & UIPropOverride>(
    ({ className, ui, ...props }, ref) => (
        <div ref={ref} className={cn(headerVariants({ ui: useResolvedUI(ui) }), className)} {...props} />
    ),
);
BaseCardHeader.displayName = 'BaseCardHeader';

const bodyVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'e-flex-auto e-p-6',
            tw: 'e-p-6 e-pt-0',
        },
    },
});

const BaseCardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & UIPropOverride>(
    ({ className, ui, ...props }, ref) => (
        <div ref={ref} className={cn(bodyVariants({ ui: useResolvedUI(ui) }), className)} {...props} />
    ),
);
BaseCardBody.displayName = 'BaseCardBody';

const footerVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'e-border-0 e-border-t e-border-solid e-border-dark-border e-rounded-b-[7px] e-px-dk-4 e-py-4',
            tw: 'e-flex e-items-center e-p-6 e-pt-0',
        },
    },
});

const BaseCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & UIPropOverride>(
    ({ className, ui, ...props }, ref) => (
        <div ref={ref} className={cn(footerVariants({ ui: useResolvedUI(ui) }), className)} {...props} />
    ),
);
BaseCardFooter.displayName = 'BaseCardFooter';

const titleVariants = cva([], {
    defaultVariants: { ui: 'tw' },
    variants: {
        ui: {
            dashkit: 'e-m-0 e-text-dk-h4 e-font-medium e-leading-[1.1] e-tracking-[-0.02em]',
            tw: 'e-text-sm e-font-medium e-leading-none e-tracking-tight',
        },
    },
});

const BaseCardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & UIPropOverride>(
    ({ className, ui, ...props }, ref) => (
        <div ref={ref} className={cn(titleVariants({ ui: useResolvedUI(ui) }), className)} {...props} />
    ),
);
BaseCardTitle.displayName = 'BaseCardTitle';

// OKLCH-only sub-component; no dashkit equivalent so it renders the same in both UIs.
const BaseCardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('e-text-sm e-text-neutral-500', className)} {...props} />
    ),
);
BaseCardDescription.displayName = 'BaseCardDescription';

export {
    BaseCard,
    BaseCardBody,
    BaseCardDescription,
    BaseCardFooter,
    BaseCardHeader,
    BaseCardTitle,
    cardVariants as baseCardVariants,
};
