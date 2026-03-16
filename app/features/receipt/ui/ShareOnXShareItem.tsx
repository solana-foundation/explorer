'use client';

import { useToast } from '@/app/components/shared/ui/sonner/use-toast';

import { XIcon } from './icons/XIcon';
import { PopoverMenuItem } from './PopoverMenuItem';

interface ShareOnXShareItemProps {
    onShare?: () => void;
}

export function ShareOnXShareItem({ onShare }: ShareOnXShareItemProps) {
    const toast = useToast();

    function handleClick() {
        const url = encodeURIComponent(globalThis.location.href);
        // 'noreferrer' without 'noopener': noreferrer implicitly sets noopener, and also prevents
        // sending the Referer header, which avoids leaking the current page URL to X.
        const win = globalThis.open(`https://x.com/intent/tweet?url=${url}`, '_blank', 'noreferrer');
        if (win) {
            onShare?.();
        } else {
            toast.custom({ title: 'Failed to open share window', type: 'error' });
        }
    }

    return <PopoverMenuItem icon={<XIcon aria-hidden="true" />} label="Share on X" onClick={handleClick} />;
}
