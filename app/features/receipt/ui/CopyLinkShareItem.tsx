'use client';

import { Check, Link } from 'react-feather';

import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { ShareMenuItem } from './ShareMenuItem';

export function CopyLinkShareItem() {
    const [state, copy] = useCopyToClipboard();

    function handleClick() {
        copy(globalThis.location.href);
    }

    return (
        <ShareMenuItem
            icon={state === 'copied' ? <Check size={11} /> : <Link size={11} />}
            label={state === 'copied' ? 'Copied!' : 'Copy link'}
            onClick={handleClick}
        />
    );
}
