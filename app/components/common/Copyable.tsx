'use client';

import React, { ReactNode, useState } from 'react';
import { CheckCircle, Copy, XCircle } from 'react-feather';

type CopyState = 'copy' | 'copied' | 'errored';

export function Copyable({ text, children }: { text: string; children: ReactNode }) {
    const [state, setState] = useState<CopyState>('copy');

    const handleClick = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setState('copied');
        } catch (err) {
            setState('errored');
        }
        setTimeout(() => setState('copy'), 1000);
    };

    function CopyIcon() {
        if (state === 'copy') {
            return <Copy className="align-text-top c-pointer" onClick={handleClick} size={13} />;
        } else if (state === 'copied') {
            return <CheckCircle className="align-text-top" size={13} />;
        } else if (state === 'errored') {
            return (
                <span title="Please check your browser's copy permissions.">
                    <XCircle className="align-text-top" size={13} />
                </span>
            );
        }
        return null;
    }

    let textColor = '';
    if (state === 'copied') {
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
