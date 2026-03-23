'use client';

import { Check, Link, XCircle } from 'react-feather';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { PopoverMenuItem } from './PopoverMenuItem';

interface CopyLinkShareItemProps {
    onCopy?: () => void;
}

export function CopyLinkShareItem({ onCopy }: CopyLinkShareItemProps) {
    const [state, copy] = useCopyToClipboard();

    function handleClick() {
        const href = globalThis.location?.href;
        if (!href) return;
        copy(href);
        onCopy?.();
    }

    function getIcon() {
        if (state === 'copied') return <Check size={11} aria-hidden="true" />;
        if (state === 'errored') return <XCircle size={11} aria-hidden="true" />;
        return <Link size={11} aria-hidden="true" />;
    }

    function getLabel() {
        if (state === 'copied') return 'Copied!';
        if (state === 'errored') return 'Failed to copy';
        return 'Copy link';
    }

    return <PopoverMenuItem icon={getIcon()} label={getLabel()} onClick={handleClick} />;
}
