import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// `ui` picks the visual lineage, mirroring Badge / BaseCard / BaseTable. `dashkit` emits the raw
// Bootstrap `.btn` + `.btn-<variant>` classes the rest of the app currently uses, so migrations
// don't change visuals; the dashkit branch + the dashkit-only variant values get deleted once the
// dashkit SCSS is gone.
const buttonVariants = cva([], {
    compoundVariants: [
        // ===== ui="tw" =====
        {
            class: cn(
                'e-border-solid',
                'e-inline-flex e-items-center e-justify-center e-gap-2',
                'e-whitespace-nowrap e-rounded e-text-sm e-font-medium',
                'e-transition-colors',
                'focus-visible:e-outline-none focus-visible:e-ring-2 focus-visible:e-ring-offset-2 focus-visible:e-ring-offset-transparent focus-visible:e-ring-neutral-950',
                'disabled:e-pointer-events-none disabled:e-opacity-50',
                '[&_svg]:e-pointer-events-none [&_svg]:e-size-3 [&_svg]:e-shrink-0',
            ),
            ui: 'tw',
        },
        { class: 'e-h-6 e-px-2 !e-text-[11px] !e-font-normal', size: 'compact', ui: 'tw' },
        { class: 'e-h-9 e-px-2 e-text-xs', size: 'default', ui: 'tw' },
        { class: 'e-h-7 e-w-7', size: 'icon', ui: 'tw' },
        { class: 'e-h-10 e-px-8', size: 'lg', ui: 'tw' },
        { class: 'e-h-7 e-px-2 e-text-xs', size: 'sm', ui: 'tw' },
        { class: 'e-border-0 e-bg-accent e-text-gray-900 hover:e-bg-accent/90', ui: 'tw', variant: 'accent' },
        {
            class: 'e-border e-border-outer-space-800 e-bg-outer-space-900 e-text-neutral-200 e-rounded-sm e-leading-none e-tracking-[-0.44px]',
            ui: 'tw',
            variant: 'compact',
        },
        {
            class: 'e-border e-border-neutral-700 e-bg-neutral-900 e-text-neutral-50 e-shadow hover:e-bg-neutral-900/90',
            ui: 'tw',
            variant: 'default',
        },
        {
            // e-border-0 (here and below): UA buttons carry a 2px border and @tailwind base is skipped
            class: 'e-border-0 e-bg-red-500 e-text-neutral-50 e-shadow-sm hover:e-bg-red-500/90',
            ui: 'tw',
            variant: 'destructive',
        },
        {
            class: 'e-border-0 e-bg-transparent e-text-neutral-50 hover:e-bg-neutral-800 hover:e-text-neutral-50',
            ui: 'tw',
            variant: 'ghost',
        },
        { class: 'e-border-0 e-text-neutral-900 e-underline-offset-4 hover:e-underline', ui: 'tw', variant: 'link' },
        {
            class: 'e-border e-border-neutral-600 e-bg-transparent e-text-white hover:e-bg-neutral-600/10 hover:e-text-white focus-visible:e-ring-1 focus-visible:e-ring-offset-1 focus-visible:e-ring-neutral-950',
            ui: 'tw',
            variant: 'outline',
        },
        {
            class: 'e-border-0 e-bg-neutral-100 e-text-neutral-900 e-shadow-sm hover:e-bg-neutral-100/80',
            ui: 'tw',
            variant: 'secondary',
        },

        // ===== ui="dashkit" =====
        {
            class: cn(
                'e-border-solid',
                'e-inline-block e-text-center e-align-middle e-cursor-pointer e-select-none',
                'e-bg-transparent e-border e-border-transparent e-text-white',
                'e-font-normal e-leading-[1.5] e-text-[0.9375rem]',
                'e-px-3 e-py-2 e-rounded-[0.375rem]',
                'e-transition-[color,background-color,border-color,box-shadow] e-duration-150 e-ease-in-out',
                'hover:e-text-white',
                'disabled:e-pointer-events-none disabled:e-opacity-[0.65]',
            ),
            ui: 'dashkit',
        },
        // Size modifiers — shrink/grow padding, font-size, and radius off the base.
        { class: 'e-px-2 e-py-0.5 e-text-[0.8125rem] e-leading-[1.75] e-rounded-[0.25rem]', size: 'sm', ui: 'dashkit' },
        { class: 'e-px-5 e-py-3 e-text-[0.9375rem] e-leading-[1.5] e-rounded-[0.5rem]', size: 'lg', ui: 'dashkit' },
        {
            class: 'e-bg-[#1dd79b] e-border-[#1dd79b] e-text-white hover:e-bg-[#19b784] hover:e-border-[#17ac7c]',
            ui: 'dashkit',
            variant: 'primary',
        },
        {
            class: 'e-bg-[#698582] e-border-[#698582] e-text-white hover:e-bg-[#59716f] hover:e-border-[#546a68]',
            ui: 'dashkit',
            variant: 'secondary',
        },
        {
            class: 'e-bg-[#1e2423] e-border-[#343a37] e-text-white hover:e-bg-[#1a1f1e] hover:e-border-[#2a2e2c]',
            ui: 'dashkit',
            variant: 'white',
        },
        {
            class: 'e-bg-[#232323] e-border-[#232323] e-text-white hover:e-bg-[#1e1e1e] hover:e-border-[#1c1c1c]',
            ui: 'dashkit',
            variant: 'black',
        },
        {
            class: 'e-bg-[#1b4e3f] e-border-[#1b4e3f] e-text-white hover:e-bg-[#174236] hover:e-border-[#163e32]',
            ui: 'dashkit',
            variant: 'dark',
        },
        {
            class: 'e-bg-transparent e-border-[#1dd79b] e-text-[#1dd79b] hover:e-bg-[#1dd79b] hover:e-border-[#1dd79b] hover:e-text-white disabled:e-bg-transparent disabled:e-text-[#1dd79b]',
            ui: 'dashkit',
            variant: 'outline-primary',
        },
        {
            class: 'e-bg-transparent e-border-[#b45be1] e-text-[#b45be1] hover:e-bg-[#b45be1] hover:e-border-[#b45be1] hover:e-text-white disabled:e-bg-transparent disabled:e-text-[#b45be1]',
            ui: 'dashkit',
            variant: 'outline-danger',
        },
        // Toggle-on ring; only meaningful when paired with `variant="black"` in `btn-group-toggle`.
        { active: true, class: 'e-shadow-[0_0_0_0.15rem_#33a382]', ui: 'dashkit' },
    ],
    defaultVariants: {
        active: false,
        size: 'default',
        ui: 'tw',
        variant: 'default',
    },
    variants: {
        active: { false: '', true: '' },
        size: { compact: '', default: '', icon: '', lg: '', sm: '' },
        ui: { dashkit: '', tw: '' },
        variant: {
            accent: '',
            black: '',
            compact: '',
            dark: '',
            default: '',
            destructive: '',
            ghost: '',
            link: '',
            outline: '',
            'outline-danger': '',
            'outline-primary': '',
            primary: '',
            secondary: '',
            white: '',
        },
    },
});

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, active, size, ui, variant, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return <Comp className={cn(buttonVariants({ active, size, ui, variant }), className)} ref={ref} {...props} />;
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
