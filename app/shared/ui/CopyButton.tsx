'use client';

import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { CheckCircle, Copy } from 'react-feather';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

/** Icon-only outline button that copies `value` and flips to a check for ~1s. */
export function CopyButton({
    value,
    noun,
    className,
    disabled,
}: {
    value: string;
    /** What is being copied, e.g. "signature" → "Copy signature" / "Copied signature". */
    noun?: string;
    className?: string;
    disabled?: boolean;
}) {
    const [state, copy] = useCopyToClipboard();
    const copied = state === 'copied';
    const suffix = noun ? ` ${noun}` : '';
    return (
        <Button
            variant="outline"
            size="sm"
            className={cn('border-outer-space-800', className)}
            aria-label={`${copied ? 'Copied' : 'Copy'}${suffix}`}
            disabled={disabled}
            onClick={() => copy(value)}
        >
            {copied ? <CheckCircle size={12} className="text-dk-info" /> : <Copy size={12} />}
        </Button>
    );
}
