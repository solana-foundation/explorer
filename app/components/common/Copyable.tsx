'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { CheckCircle, Copy, Loader, XCircle } from 'react-feather';

import { type CopyState, useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

export function Copyable({ text, children }: { text: string | null; children?: ReactNode }) {
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
        copied: <CheckCircle className="e-align-text-top" size={13} />,
        copy: <Copy className="e-cursor-pointer e-align-text-top" onClick={handleClick} size={13} />,
        errored: (
            <span title="Please check your browser's copy permissions.">
                <XCircle className="e-align-text-top" size={13} />
            </span>
        ),
        loading: <Loader className="e-align-text-top" size={13} />,
    };

    function CopyIcon() {
        return copyStrategy[state] || null;
    }

    let textColor = '';
    if (state === 'copied' || state === 'loading') {
        textColor = 'e-text-dk-info';
    } else if (state === 'errored') {
        textColor = 'e-text-dk-danger';
    }

    return (
        <>
            <span className="e-mr-1.5" style={{ fontSize: '12px' }}>
                <span className={textColor}>
                    <CopyIcon />
                </span>
            </span>
            {children}
        </>
    );
}
