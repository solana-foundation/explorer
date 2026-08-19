'use client';

import { Dialog, DialogOverlay, DialogPortal } from '@components/shared/ui/dialog';
import { cn } from '@components/shared/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { DrawerFooter } from './DrawerFooter';
import { DrawerHeader } from './DrawerHeader';
import { useEdgeFades } from './model/useEdgeFades';
import { useSwipeToDismiss } from './model/useSwipeToDismiss';

export type DrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Fixed region under the grab handle (title, primary id, badges). Include a DialogTitle for a11y. */
    header?: React.ReactNode;
    /** Fixed region pinned below the scroll area (action tiles). */
    footer?: React.ReactNode;
    /** Scrollable body content. */
    children: React.ReactNode;
    /** Extra classes on the sheet surface — e.g. a background/top-border matching the host card. */
    className?: string;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
} & Pick<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'aria-describedby' | 'aria-label'>;

/**
 * Shared mobile bottom-sheet, used by both the address transaction-history detail popup and the
 * transaction-page account detail popup. Owns the sheet chrome (rounded top, slide animation), a
 * swipe-to-dismiss grab handle, and background-agnostic edge fades on the scroll body (a mask, so
 * it works on any surface colour). Pages supply their own header / body / footer content.
 */
export function Drawer({
    open,
    onOpenChange,
    header,
    footer,
    children,
    className,
    onEscapeKeyDown,
    ...props
}: DrawerProps) {
    const scrollRef = React.useRef<HTMLDivElement | null>(null);
    const { dragY, dragging, closing, handleProps, bodyProps, onTransitionEnd } = useSwipeToDismiss(
        scrollRef,
        open,
        () => onOpenChange(false),
    );
    const { contentRef, maskImage, onScroll } = useEdgeFades(scrollRef, open);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay style={{ zIndex: 1201 }} />
                <DialogPrimitive.Content
                    onOpenAutoFocus={e => e.preventDefault()}
                    onEscapeKeyDown={onEscapeKeyDown}
                    className={cn(
                        'fixed inset-x-0 bottom-0 top-auto flex max-h-[85vh] w-full max-w-none flex-col',
                        'rounded-b-none rounded-t-2xl border-0 border-t border-solid border-dark-border bg-heavy-metal-900',
                        'data-[state=open]:animate-tx-drawer-in',
                        // Suppress the out-keyframe during a swipe-close: the transform below slides the
                        // sheet out from its drag offset, so the keyframe (which restarts from the open
                        // position) would otherwise snap it back up first.
                        !closing && 'data-[state=closed]:animate-tx-drawer-out',
                        className,
                    )}
                    style={{
                        transform: `translateY(${dragY}px)`,
                        transition: dragging ? 'none' : 'transform 0.2s ease-out',
                        zIndex: 1201,
                    }}
                    onTransitionEnd={onTransitionEnd}
                    {...props}
                >
                    {/* Grab handle: pinned to the top, never scrolls. The whole 28px zone is the grab area. */}
                    <div className="shrink-0 cursor-grab pb-3 pt-3" style={{ touchAction: 'none' }} {...handleProps}>
                        <div className="mx-auto h-1 w-9 rounded-full bg-outer-space-700" />
                    </div>

                    {header !== undefined && <div className="shrink-0">{header}</div>}

                    <div
                        ref={scrollRef}
                        className="min-h-0 flex-1 overflow-y-auto"
                        style={{ WebkitMaskImage: maskImage, maskImage, overscrollBehavior: 'contain' }}
                        onScroll={onScroll}
                        {...bodyProps}
                    >
                        <div ref={contentRef}>{children}</div>
                    </div>

                    {footer !== undefined && <div className="shrink-0">{footer}</div>}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}

Drawer.Footer = DrawerFooter;
Drawer.Header = DrawerHeader;
