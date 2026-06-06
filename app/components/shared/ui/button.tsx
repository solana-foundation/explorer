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
            class: 'e-bg-red-500 e-text-neutral-50 e-shadow-sm hover:e-bg-red-500/90',
            ui: 'tw',
            variant: 'destructive',
        },
        {
            class: 'e-border-0 e-bg-transparent e-text-neutral-50 hover:e-bg-neutral-800 hover:e-text-neutral-50',
            ui: 'tw',
            variant: 'ghost',
        },
        { class: 'e-text-neutral-900 e-underline-offset-4 hover:e-underline', ui: 'tw', variant: 'link' },
        {
            class: 'e-border e-border-neutral-600 e-bg-transparent e-text-white hover:e-bg-neutral-600/10 hover:e-text-white focus-visible:e-ring-1 focus-visible:e-ring-offset-1 focus-visible:e-ring-neutral-950',
            ui: 'tw',
            variant: 'outline',
        },
        {
            class: 'e-bg-neutral-100 e-text-neutral-900 e-shadow-sm hover:e-bg-neutral-100/80',
            ui: 'tw',
            variant: 'secondary',
        },

        // ===== ui="dashkit" =====
        { class: 'btn', ui: 'dashkit' },
        // Bootstrap modifier — `.btn-sm` / `.btn-lg` shrink/grow padding + font-size off the base `.btn`.
        { class: 'btn-sm', size: 'sm', ui: 'dashkit' },
        { class: 'btn-lg', size: 'lg', ui: 'dashkit' },
        { class: 'btn-primary', ui: 'dashkit', variant: 'primary' },
        { class: 'btn-secondary', ui: 'dashkit', variant: 'secondary' },
        { class: 'btn-white', ui: 'dashkit', variant: 'white' },
        { class: 'btn-black', ui: 'dashkit', variant: 'black' },
        { class: 'btn-dark', ui: 'dashkit', variant: 'dark' },
        { class: 'btn-outline-primary', ui: 'dashkit', variant: 'outline-primary' },
        { class: 'btn-outline-danger', ui: 'dashkit', variant: 'outline-danger' },
        // `active` pairs with `btn-black` for the toggle-on look in `btn-group-toggle`.
        { active: true, class: 'active', ui: 'dashkit' },
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
