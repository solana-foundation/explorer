'use client';

import { XIcon } from './icons/XIcon';
import { PopoverMenuItem } from './PopoverMenuItem';

interface ShareOnXShareItemProps {
    onShare?: () => void;
}

export function ShareOnXShareItem({ onShare }: ShareOnXShareItemProps) {
    function handleClick() {
        const url = encodeURIComponent(globalThis.location.href);
        globalThis.open(`https://x.com/intent/tweet?url=${url}`, '_blank', 'noopener,noreferrer');
        onShare?.();
    }

    return <PopoverMenuItem icon={<XIcon />} label="Share on X" onClick={handleClick} />;
}
