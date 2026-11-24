'use client';

import { Button } from '@components/shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@components/shared/ui/dialog';
import { cn } from '@components/shared/utils';
import type { ReactElement } from 'react';
import { AlertTriangle } from 'react-feather';

const CONTENT_CLASSES = '!gap-3 !border-outer-space-800 !bg-outer-space-900 !p-5 !pt-6';
const PLATE_CLASSES = 'rounded-md border border-solid border-white/10 bg-outer-space-800 p-3 text-left';
const LABEL_CLASSES = 'text-xs uppercase text-outer-space-300';
const ACTION_CLASSES = 'focus-visible:!ring-1 focus-visible:!ring-accent focus-visible:!ring-offset-0';
const DANGER_CLASSES = '!bg-dk-danger hover:!bg-dk-danger/90';
const FOOTER_CLASSES = '!flex-row !items-center !justify-start gap-2 pt-1 sm:!space-x-0';

export function OriginalImageDialog({ uri, children }: { uri: string; children: ReactElement }) {
    const url = new URL(uri);

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className={CONTENT_CLASSES}>
                <DialogHeader className="!space-y-0 !text-left">
                    <DialogTitle className="!text-xl !font-medium !leading-snug !text-dk-danger">
                        <AlertTriangle size={24} aria-hidden className="mr-2 inline-block align-[-0.2em]" />
                        Open the original image?
                    </DialogTitle>
                </DialogHeader>

                <div className="mb-5 flex flex-col gap-2 text-left">
                    <DialogDescription className="m-0 !text-[13px] leading-relaxed !text-white">
                        It opens on the server that hosts it, outside the Explorer. That server sees your IP address,
                        and what it sends back may not be an image.
                    </DialogDescription>

                    <div className={PLATE_CLASSES}>
                        <div className={LABEL_CLASSES}>Server</div>
                        <div className="mt-1 break-all font-mono text-sm text-white">{url.host}</div>
                        <div className="mt-1.5 break-all font-mono text-xs text-outer-space-300">{url.href}</div>
                    </div>
                </div>

                <DialogFooter className={FOOTER_CLASSES}>
                    <DialogClose asChild>
                        <Button
                            size="lg"
                            variant="destructive"
                            className={cn(ACTION_CLASSES, DANGER_CLASSES)}
                            onClick={() => window.open(url.href, '_blank', 'noopener,noreferrer')}
                        >
                            Open
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button size="lg" variant="outline" className={ACTION_CLASSES}>
                            Cancel
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
