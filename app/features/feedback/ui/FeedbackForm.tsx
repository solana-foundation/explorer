'use client';

import { useId, useState } from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { Input, inputVariants } from '@/app/components/shared/ui/input';
import { Label } from '@/app/components/shared/ui/label';
import { cn } from '@/app/components/shared/utils';

import { FEEDBACK_SEND_ERROR, type FeedbackFormValues } from '../model/use-feedback-form';
import { BaseStarRating } from './BaseStarRating';

export interface FeedbackFormProps {
    isSubmitting: boolean;
    error: boolean;
    onSubmit: (values: FeedbackFormValues) => void;
}

const FIELD = '!border-outer-space-800';

export function FeedbackForm({ isSubmitting, error, onSubmit }: FeedbackFormProps) {
    const [rating, setRating] = useState(0);
    const id = useId();

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={event => {
                event.preventDefault();
                if (isSubmitting) return;
                const data = new FormData(event.currentTarget);
                onSubmit({
                    contact: String(data.get('contact') || '') || undefined,
                    message: String(data.get('message') || ''),
                    rating: rating || undefined,
                });
            }}
        >
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-200">
                    Rating <span className="font-normal text-outer-space-300">(optional)</span>
                </span>
                <div className="-ml-1 [&>[role=radiogroup]]:justify-start">
                    <BaseStarRating onChange={setRating} value={rating} />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <Label className="text-neutral-200" htmlFor={`${id}-message`}>
                    Feedback
                </Label>
                <textarea
                    className={cn(inputVariants({ variant: 'dark' }), 'h-auto resize-none', FIELD)}
                    id={`${id}-message`}
                    maxLength={4096}
                    name="message"
                    required
                    rows={4}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label className="text-neutral-200" htmlFor={`${id}-contact`}>
                    X handle <span className="font-normal text-outer-space-300">(optional)</span>
                </Label>
                <Input className={FIELD} id={`${id}-contact`} maxLength={16} name="contact" variant="dark" />
                <p className="m-0 text-xs text-outer-space-300">So we can reach out if we have any questions</p>
            </div>
            <div className="flex items-center gap-3">
                <Button className="self-start" disabled={isSubmitting} size="lg" type="submit" variant="accent">
                    {isSubmitting ? 'Sending…' : 'Submit'}
                </Button>
                {error && (
                    <p className="m-0 text-xs text-destructive" role="alert">
                        {FEEDBACK_SEND_ERROR.title}. {FEEDBACK_SEND_ERROR.description}
                    </p>
                )}
            </div>
        </form>
    );
}
