'use client';

import { XIcon } from './icons/XIcon';
import { PopoverMenuItem } from './PopoverMenuItem';

interface ShareOnXShareItemProps {
    onShare?: () => void;
}

export function ShareOnXShareItem({ onShare }: ShareOnXShareItemProps) {
    function handleClick() {
        const url = encodeURIComponent(globalThis.location.href);
        const win = globalThis.open(`https://x.com/intent/tweet?url=${url}`, '_blank', 'noreferrer');
        if (win) onShare?.();
    }

    return <PopoverMenuItem icon={<XIcon />} label="Share on X" onClick={handleClick} />;
}
