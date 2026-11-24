import { CheckCircle, Copy, XCircle } from 'react-feather';

import type { CopyState } from '@/app/shared/lib/useCopyToClipboard';

// The caller owns the copy state, so a click elsewhere (a JSON row's text) can flip this button's icon.
export function InlineCopyButton({
    noun,
    state,
    onCopy,
}: {
    /** What is copied, e.g. "JSON" → "Copy JSON". */
    noun: string;
    state: CopyState;
    onCopy: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={`${state === 'copied' ? 'Copied' : 'Copy'} ${noun}`}
            onClick={onCopy}
            // Ring, not outline: the global `button:focus { outline: none !important }` would win otherwise.
            className="m-0 cursor-pointer rounded-sm border-0 bg-transparent p-0 text-[12px] leading-none text-inherit focus-visible:ring-2 focus-visible:ring-accent"
        >
            {state === 'copied' ? (
                <CheckCircle className="align-text-top text-dk-info" size={13} />
            ) : state === 'errored' ? (
                <XCircle className="align-text-top text-dk-danger" size={13} />
            ) : (
                <Copy className="align-text-top" size={13} />
            )}
        </button>
    );
}
