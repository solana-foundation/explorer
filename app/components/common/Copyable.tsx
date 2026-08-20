'use client';

import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { type ReactNode, useEffect, useState } from 'react';
import { CheckCircle, Copy, Loader, XCircle } from 'react-feather';

import { type CopyState, useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

type CopyableProps = {
    text: string | null;
    children?: ReactNode;
    asTile?: boolean;
    className?: string;
};

export function Copyable({ text, children, asTile = false, className }: CopyableProps) {
    const [clipboardState, copy] = useCopyToClipboard(1000);
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        if (typeof text !== 'string') {
            setLoading(true);
            return;
        }
        copy(text);
    };

    useEffect(() => {
        if (loading && typeof text === 'string') {
            copy(text);
            setLoading(false);
        }
    }, [text, loading, copy]);

    const state: CopyState | 'loading' = loading ? 'loading' : clipboardState;

    const copyStrategy: Record<CopyState | 'loading', JSX.Element> = {
        copied: <CheckCircle className="align-text-top" size={13} />,
        // In tile mode the enclosing Button owns the click; keep the inline glyph clickable otherwise.
        copy: <Copy className="cursor-pointer align-text-top" onClick={asTile ? undefined : handleClick} size={13} />,
        errored: (
            <span title="Please check your browser's copy permissions.">
                <XCircle className="align-text-top" size={13} />
            </span>
        ),
        loading: <Loader className="align-text-top" size={13} />,
    };

    function CopyIcon() {
        return copyStrategy[state] || null;
    }

    let textColor = '';
    if (state === 'copied' || state === 'loading') {
        textColor = 'text-dk-info';
    } else if (state === 'errored') {
        textColor = 'text-dk-danger';
    }

    if (asTile) {
        return (
            <Button
                type="button"
                size="tile"
                variant="outline"
                onClick={handleClick}
                aria-label={state === 'copied' ? 'Copied' : 'Copy'}
                className={cn(className, state === 'copied' && 'animate-tx-copy-flash')}
            >
                <span className={textColor}>
                    <CopyIcon />
                </span>
                {children}
            </Button>
        );
    }

    return (
        <>
            <span className="mr-1.5" style={{ fontSize: '12px' }}>
                <span className={textColor}>
                    <CopyIcon />
                </span>
            </span>
            {children}
        </>
    );
}
