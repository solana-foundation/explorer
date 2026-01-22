'use client';

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { CheckCircle, Copy, Loader, XCircle } from 'react-feather';

type CopyState = 'copy' | 'copied' | 'errored' | 'loading';

export function Copyable({ text, children }: { text: string | null; children: ReactNode }) {
    const [state, setState] = useState<CopyState>('copy');

    const handleClick = async () => {
        if (typeof text !== 'string') {
            setState('loading');
            return;
        }
        proceedCopy(text);
    };

    const copyStrategy: Record<CopyState, JSX.Element> = {
        copied: <CheckCircle className="align-text-top" size={13} />,
        copy: <Copy className="align-text-top c-pointer" onClick={handleClick} size={13} />,
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

    const proceedCopy = useCallback(
        async (textToCopy: string) => {
            try {
                await navigator.clipboard.writeText(textToCopy);
                setState('copied');
            } catch (err) {
                setState('errored');
            }
            setTimeout(() => setState('copy'), 1000);
        },
        [setState]
    );

    useEffect(() => {
        if (state === 'loading' && typeof text === 'string') {
            proceedCopy(text);
        }
    }, [text, state, proceedCopy]);

    let textColor = '';
    if (state === 'copied' || state === 'loading') {
        textColor = 'text-info';
    } else if (state === 'errored') {
        textColor = 'text-danger';
    }

    function PrependCopyIcon() {
        return (
            <>
                <span className="font-size-tiny me-2" style={{ fontSize: '12px' }}>
                    <span className={textColor}>
                        <CopyIcon />
                    </span>
                </span>
                {children}
            </>
        );
    }

    return <PrependCopyIcon />;
}
