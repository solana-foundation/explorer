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
            'fixed inset-0 z-[1201] bg-black/60',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'duration-300',
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
                'fixed inset-x-0 bottom-0 z-[1201]',
                'flex max-h-[85dvh] flex-col',
                'rounded-t-2xl bg-outer-space-950',
                'shadow-[0_-4px_32px_rgba(0,0,0,0.6)]',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                'duration-300 ease-in-out',
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
                'flex shrink-0 items-center justify-between border-b border-solid border-white/10 px-4 py-3',
                className,
            )}
            {...props}
        />
    );
}

function SlideoverTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof Title>) {
    return <Title className={cn('text-base font-medium text-white', className)} {...props} />;
}

function SlideoverBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex-1 overflow-y-auto overflow-x-hidden', className)} {...props} />;
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
