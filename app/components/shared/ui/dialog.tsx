import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';
import { X } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'e-fixed e-inset-0 e-z-50 e-bg-black/80',
            'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
            'data-[state=closed]:e-fade-out-0 data-[state=open]:e-fade-in-0',
            className
        )}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'e-fixed e-left-[50%] e-top-[50%] e-z-50 e-grid e-w-full e-max-w-sm',
                'e-translate-x-[-50%] e-translate-y-[-50%] e-gap-4',
                'e-border e-border-neutral-200 e-bg-neutral-800 e-p-4 e-shadow-lg e-duration-200',
                'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
                'data-[state=closed]:e-fade-out-0 data-[state=open]:e-fade-in-0',
                'data-[state=closed]:e-zoom-out-95 data-[state=open]:e-zoom-in-95',
                'data-[state=closed]:e-slide-out-to-left-1/2 data-[state=closed]:e-slide-out-to-top-[48%]',
                'data-[state=open]:e-slide-in-from-left-1/2 data-[state=open]:e-slide-in-from-top-[48%]',
                'sm:e-rounded-lg',
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close
                className={cn(
                    'e-border-0 e-bg-transparent e-p-0 e-text-neutral-500',
                    'e-absolute e-right-4 e-top-2 e-rounded-sm e-opacity-70',
                    'e-ring-offset-white e-transition-opacity',
                    'hover:e-opacity-100',
                    'focus:e-outline-none focus:e-ring-2 focus:e-ring-neutral-950 focus:e-ring-offset-2',
                    'disabled:e-pointer-events-none'
                )}
            >
                <X size={16} />
                <span className="e-sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('e-flex e-flex-col e-space-y-1', 'e-text-center sm:e-text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('e-flex e-flex-col-reverse', 'sm:e-flex-row sm:e-justify-end sm:e-space-x-1', className)}
        {...props}
    />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('e-m-0 e-text-base e-font-medium e-text-white', 'e-leading-none e-tracking-tight', className)}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn('e-text-sm e-text-neutral-400', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
