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
                'border-solid',
                'inline-flex items-center justify-center gap-2',
                'whitespace-nowrap rounded text-sm font-medium',
                'transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-neutral-950',
                'disabled:pointer-events-none disabled:opacity-50',
                '[&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0',
            ),
            ui: 'tw',
        },
        { class: 'h-6 px-2 !text-[11px] !font-normal', size: 'compact', ui: 'tw' },
        { class: 'h-9 px-2 text-xs', size: 'default', ui: 'tw' },
        { class: 'h-7 w-7', size: 'icon', ui: 'tw' },
        { class: 'h-10 px-8', size: 'lg', ui: 'tw' },
        { class: 'h-7 px-2 text-xs', size: 'sm', ui: 'tw' },
        { class: 'border-0 bg-accent text-gray-900 hover:bg-accent/90', ui: 'tw', variant: 'accent' },
        {
            class: 'border border-outer-space-800 bg-outer-space-900 text-neutral-200 rounded-sm leading-none tracking-[-0.44px]',
            ui: 'tw',
            variant: 'compact',
        },
        {
            class: 'border border-neutral-700 bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/90',
            ui: 'tw',
            variant: 'default',
        },
        {
            // border-0 (here and below): UA buttons carry a 2px border and @tailwind base is skipped
            class: 'border-0 bg-red-500 text-neutral-50 shadow-sm hover:bg-red-500/90',
            ui: 'tw',
            variant: 'destructive',
        },
        {
            class: 'border-0 bg-transparent text-neutral-50 hover:bg-neutral-800 hover:text-neutral-50',
            ui: 'tw',
            variant: 'ghost',
        },
        { class: 'border-0 text-neutral-900 underline-offset-4 hover:underline', ui: 'tw', variant: 'link' },
        {
            class: 'border border-neutral-600 bg-transparent text-white hover:bg-neutral-600/10 hover:text-white focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-neutral-950',
            ui: 'tw',
            variant: 'outline',
        },
        {
            class: 'border-0 bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-100/80',
            ui: 'tw',
            variant: 'secondary',
        },

        // ===== ui="dashkit" =====
        // Defaults that would conflict with per-variant compounds (bg/border) or per-size
        // compounds (padding/text/leading/rounded) are intentionally omitted — twMerge can't
        // dedupe through the e- prefix, so source order in the compiled CSS would otherwise
        // let the larger/wider base values beat the size compound.
        {
            // text-white intentionally omitted — variant compounds own text color and twMerge
            // can't dedupe through the e- prefix, so a base color would beat the variant's arbitrary
            // value in CSS source order (e.g. .btn-primary needs #1b4e3f per _solana.scss override).
            class: cn(
                'inline-block text-center align-middle cursor-pointer select-none',
                'border border-solid',
                'font-normal',
                'transition-[color,background-color,border-color,box-shadow] duration-150 ease-in-out',
                'disabled:pointer-events-none disabled:opacity-[0.65]',
            ),
            ui: 'dashkit',
        },
        // Size modifiers — each owns padding, font-size, line-height, and radius outright.
        {
            class: 'px-3 py-2 text-[0.9375rem] leading-[1.5] rounded-[0.375rem]',
            size: 'default',
            ui: 'dashkit',
        },
        { class: 'px-2 py-0.5 text-[0.8125rem] leading-[1.75] rounded-[0.25rem]', size: 'sm', ui: 'dashkit' },
        { class: 'px-5 py-3 text-[0.9375rem] leading-[1.5] rounded-[0.5rem]', size: 'lg', ui: 'dashkit' },
        {
            // _solana.scss .btn-primary{color:$gray-900} only beats the idle rule — Bootstrap's :hover/:disabled (class+pseudo) kept white.
            class: 'bg-[#1dd79b] border-[#1dd79b] text-[#1b4e3f] hover:bg-[#19b784] hover:border-[#17ac7c] hover:text-white disabled:text-white',
            ui: 'dashkit',
            variant: 'primary',
        },
        {
            class: 'bg-[#698582] border-[#698582] text-white hover:bg-[#59716f] hover:border-[#546a68]',
            ui: 'dashkit',
            variant: 'secondary',
        },
        {
            class: 'bg-[#1e2423] border-[#343a37] text-white hover:bg-[#1a1f1e] hover:border-[#2a2e2c]',
            ui: 'dashkit',
            variant: 'white',
        },
        {
            class: 'bg-[#232323] border-[#232323] text-white hover:bg-[#1e1e1e] hover:border-[#1c1c1c]',
            ui: 'dashkit',
            variant: 'black',
        },
        {
            class: 'bg-[#1b4e3f] border-[#1b4e3f] text-white hover:bg-[#174236] hover:border-[#163e32]',
            ui: 'dashkit',
            variant: 'dark',
        },
        {
            class: 'bg-transparent border-[#1dd79b] text-[#1dd79b] hover:bg-[#1dd79b] hover:border-[#1dd79b] hover:text-white disabled:bg-transparent disabled:text-[#1dd79b]',
            ui: 'dashkit',
            variant: 'outline-primary',
        },
        {
            class: 'bg-transparent border-[#b45be1] text-[#b45be1] hover:bg-[#b45be1] hover:border-[#b45be1] hover:text-white disabled:bg-transparent disabled:text-[#b45be1]',
            ui: 'dashkit',
            variant: 'outline-danger',
        },
        {
            class: 'bg-transparent border-[#fa62fc] text-[#fa62fc] hover:bg-[#fa62fc] hover:border-[#fa62fc] hover:text-white disabled:bg-transparent disabled:text-[#fa62fc]',
            ui: 'dashkit',
            variant: 'outline-warning',
        },
        {
            class: 'bg-[#fa62fc] border-[#fa62fc] text-white hover:bg-[#d553d6] hover:border-[#c84eca]',
            ui: 'dashkit',
            variant: 'warning',
        },
        {
            class: 'bg-[#b45be1] border-[#b45be1] text-white hover:bg-[#994dbf] hover:border-[#9049b4]',
            ui: 'dashkit',
            variant: 'danger',
        },
        // Toggle-on ring; only meaningful when paired with `variant="black"` in `btn-group-toggle`.
        { active: true, class: 'shadow-[0_0_0_0.15rem_#33a382]', ui: 'dashkit' },
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
            danger: '',
            dark: '',
            default: '',
            destructive: '',
            ghost: '',
            link: '',
            outline: '',
            'outline-danger': '',
            'outline-primary': '',
            'outline-warning': '',
            primary: '',
            secondary: '',
            warning: '',
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
