'use client';

import { Check, Link, XCircle } from 'react-feather';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { ShareMenuItem } from './ShareMenuItem';

export function CopyLinkShareItem() {
    const [state, copy] = useCopyToClipboard();

    function handleClick() {
        copy(globalThis.location.href);
    }

    function getIcon() {
        if (state === 'copied') return <Check size={11} />;
        if (state === 'errored') return <XCircle size={11} />;
        return <Link size={11} />;
    }

    function getLabel() {
        if (state === 'copied') return 'Copied!';
        if (state === 'errored') return 'Failed to copy';
        return 'Copy link';
    }

    return <ShareMenuItem icon={getIcon()} label={getLabel()} onClick={handleClick} />;
}
