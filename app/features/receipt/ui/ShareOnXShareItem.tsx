'use client';

import { NormalizedXMark } from '@/app/shared/ui/icons/normalized';

import { PopoverMenuItem } from './PopoverMenuItem';

interface ShareOnXShareItemProps {
    onShare?: () => void;
}

export function ShareOnXShareItem({ onShare }: ShareOnXShareItemProps) {
    function handleClick() {
        const url = encodeURIComponent(globalThis.location.href);
        // 'noreferrer' without 'noopener': noreferrer implicitly sets noopener, and also prevents
        // sending the Referer header, which avoids leaking the current page URL to X.
        // Note: window.open() with 'noreferrer' always returns null (the reference is severed),
        // so we cannot detect popup blocking this way — just proceed unconditionally.
        globalThis.open(`https://x.com/intent/tweet?url=${url}`, '_blank', 'noreferrer');
        onShare?.();
    }

    return <PopoverMenuItem icon={<NormalizedXMark aria-hidden="true" />} label="Share on X" onClick={handleClick} />;
}
