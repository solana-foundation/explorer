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
import { AlertCircle, ExternalLink } from 'react-feather';

interface ExternalLinkWarningProps {
    href: string;
    children: React.ReactNode;
}

export function ExternalLinkWarning({ href, children }: ExternalLinkWarningProps) {
    const handleContinue = () => {
        window.open(href, '_blank', 'noopener,noreferrer');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button ui="dashkit" variant="white" size="sm">
                    {children}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="text-destructive" size={16} />
                        Leaving Solana Explorer
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 pl-6">
                    <DialogDescription>You are about to visit an external website.</DialogDescription>
                    <DialogDescription className="break-all font-mono text-xs">{href}</DialogDescription>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button variant="default" size="sm" onClick={handleContinue}>
                        <ExternalLink size={14} />
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
