import { useEffect, useState } from 'react';
import { ExternalLink as ExternalLinkIcon, X } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/app/components/shared/ui/dialog';
import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { Input, inputVariants } from '@/app/components/shared/ui/input';
import { Label } from '@/app/components/shared/ui/label';
import { cn } from '@/app/components/shared/utils';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { Drawer } from '@/app/shared/ui/drawer';

import { BaseStarRating } from './BaseStarRating';

export interface FeedbackFormValues {
    contact?: string;
    message: string;
    /** A value from 1 to 5, or `undefined` when the user selects no star. */
    rating?: number;
}

export interface BaseFeedbackFormProps {
    bugReportUrl: string;
    ideasUrl: string;
    isSubmitting?: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: FeedbackFormValues) => void;
    open: boolean;
}

const DESCRIPTION = "Any features missing or ideas to share? Drop them below and we'll consider adding them";

export function BaseFeedbackForm({
    bugReportUrl,
    ideasUrl,
    isSubmitting = false,
    onOpenChange,
    onSubmit,
    open,
}: BaseFeedbackFormProps) {
    const [rating, setRating] = useState(0);
    const { isSm } = useBreakpoint();

    // The close after a successful send does not call onOpenChange, so the reset reads `open`.
    useEffect(() => {
        if (!open) setRating(0);
    }, [open]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({
            contact: String(data.get('contact') || '') || undefined,
            message: String(data.get('message') || ''),
            rating: rating || undefined,
        });
    };

    const form = (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <BaseStarRating onChange={setRating} value={rating} />
            <div className="flex flex-col gap-1.5">
                <Label className="text-neutral-200" htmlFor="feedback-message">
                    Feedback
                </Label>
                <textarea
                    className={cn(inputVariants({ variant: 'dark' }), 'h-auto resize-none')}
                    id="feedback-message"
                    // Sentry rejects oversized events, and breadcrumbs add to the event size.
                    maxLength={4096}
                    name="message"
                    required
                    rows={5}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label className="text-neutral-200" htmlFor="feedback-contact">
                    X handle <span className="font-normal text-neutral-400">(optional)</span>
                </Label>
                {/* X handles have at most 15 characters, plus an optional @. */}
                <Input id="feedback-contact" maxLength={16} name="contact" variant="dark" />
                <p className="m-0 text-xs text-neutral-400">So we can reach out if we have any questions</p>
            </div>
            <Button disabled={isSubmitting} type="submit" ui="tw" variant="accent">
                Submit
            </Button>
        </form>
    );

    const githubLinks = (
        <p className="m-0 text-center text-xs text-neutral-400">
            Prefer GitHub?{' '}
            <ExternalLink className="cursor-pointer text-accent no-underline hover:underline" href={ideasUrl}>
                Suggest a feature <ExternalLinkIcon className="inline align-[-2px]" size={12} />
            </ExternalLink>{' '}
            or{' '}
            <ExternalLink className="cursor-pointer text-accent no-underline hover:underline" href={bugReportUrl}>
                report a bug <ExternalLinkIcon className="inline align-[-2px]" size={12} />
            </ExternalLink>
        </p>
    );

    if (!isSm) {
        const header = (
            <Drawer.Header>
                <div className="flex items-center justify-between">
                    <DialogTitle>Give feedback</DialogTitle>
                    <DialogClose className="flex items-center justify-center rounded-sm border-0 bg-transparent p-0 text-neutral-500 opacity-70 transition-opacity hover:opacity-100">
                        <X size={16} />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </div>
            </Drawer.Header>
        );

        return (
            <Drawer open={open} onOpenChange={onOpenChange} header={header} aria-describedby={undefined}>
                <div className="flex flex-col gap-4 p-4 pb-6">
                    <p className="m-0 text-sm text-neutral-400">{DESCRIPTION}</p>
                    {form}
                    {githubLinks}
                </div>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Give feedback</DialogTitle>
                    <DialogDescription>{DESCRIPTION}</DialogDescription>
                </DialogHeader>
                {form}
                {githubLinks}
            </DialogContent>
        </Dialog>
    );
}
