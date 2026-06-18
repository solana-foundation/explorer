import { Close, Content, Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const Slideover = Root;
const SlideoverTrigger = Trigger;
const SlideoverClose = Close;
const SlideoverPortal = Portal;

const SlideoverOverlay = React.forwardRef<
    React.ElementRef<typeof Overlay>,
    React.ComponentPropsWithoutRef<typeof Overlay>
>(({ className, ...props }, ref) => (
    <Overlay
        ref={ref}
        className={cn(
            'e-fixed e-inset-0 e-z-50 e-bg-black/60',
            'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
            'data-[state=closed]:e-fade-out-0 data-[state=open]:e-fade-in-0',
            'e-duration-300',
            className,
        )}
        {...props}
    />
));
SlideoverOverlay.displayName = Overlay.displayName;

const SlideoverContent = React.forwardRef<
    React.ElementRef<typeof Content>,
    React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
    <SlideoverPortal>
        <SlideoverOverlay />
        <Content
            ref={ref}
            className={cn(
                'e-fixed e-inset-x-0 e-bottom-0 e-z-50',
                'e-flex e-max-h-[85dvh] e-flex-col',
                'e-rounded-t-2xl e-bg-outer-space-950',
                'e-shadow-[0_-4px_32px_rgba(0,0,0,0.6)]',
                'data-[state=open]:e-animate-in data-[state=closed]:e-animate-out',
                'data-[state=closed]:e-slide-out-to-bottom data-[state=open]:e-slide-in-from-bottom',
                'e-duration-300 e-ease-in-out',
                className,
            )}
            {...props}
        >
            {children}
        </Content>
    </SlideoverPortal>
));
SlideoverContent.displayName = Content.displayName;

function SlideoverHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'e-flex e-shrink-0 e-items-center e-justify-between e-border-b e-border-solid e-border-white/10 e-px-4 e-py-3',
                className,
            )}
            {...props}
        />
    );
}

function SlideoverTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Title>) {
    return <Title className={cn('e-text-base e-font-medium e-text-white', className)} {...props} />;
}

function SlideoverBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('e-flex-1 e-overflow-y-auto e-overflow-x-hidden', className)} {...props} />;
}

export {
    Slideover,
    SlideoverBody,
    SlideoverClose,
    SlideoverContent,
    SlideoverHeader,
    SlideoverTitle,
    SlideoverTrigger,
};
