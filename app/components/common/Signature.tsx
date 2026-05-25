'use client';

import { cn } from '@shared/utils';
import { TransactionSignature } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

import { Copyable } from './Copyable';

const MID_TRUNCATE_CHARS = 5;

// Space reserved for Copyable's copy icon (13px SVG + 8px me-2 margin)
const COPY_ICON_RESERVED_PX = 24;

type Props = {
    signature: TransactionSignature;
    alignRight?: boolean;
    link?: boolean;
    noTruncate?: boolean;
};

export function Signature({ signature, alignRight, link, noTruncate }: Props) {
    const transactionPath = useClusterPath({ pathname: `/tx/${signature}` });
    const midTruncatedText = `${signature.slice(0, MID_TRUNCATE_CHARS)}...${signature.slice(-MID_TRUNCATE_CHARS)}`;

    const rowRef = useRef<HTMLDivElement>(null);
    const hiddenTextRef = useRef<HTMLSpanElement>(null);
    const [isMidTruncated, setIsMidTruncated] = useState(false);

    useEffect(() => {
        if (noTruncate) {
            setIsMidTruncated(false);
            return;
        }

        const check = () => {
            const row = rowRef.current;
            const hidden = hiddenTextRef.current;
            if (!row || !hidden) return;
            // Use getBoundingClientRect for sub-pixel precision
            const available = row.clientWidth - COPY_ICON_RESERVED_PX;
            setIsMidTruncated(hidden.getBoundingClientRect().width > available);
        };

        const observer = new ResizeObserver(check);
        if (rowRef.current) observer.observe(rowRef.current);
        check();
        return () => observer.disconnect();
    }, [noTruncate]);

    const visibleText = isMidTruncated ? midTruncatedText : signature;

    return (
        <div
            ref={rowRef}
            className={cn(
                'e-relative e-flex e-w-full e-min-w-0 e-items-center e-justify-start',
                alignRight && 'lg:e-justify-end',
            )}
        >
            {!noTruncate && (
                <span
                    ref={hiddenTextRef}
                    className="e-pointer-events-none e-invisible e-absolute e-whitespace-nowrap e-font-mono"
                    aria-hidden
                >
                    {signature}
                </span>
            )}
            <Copyable text={signature}>
                <span className="e-relative e-min-w-0 e-overflow-hidden e-font-mono">
                    {link ? (
                        <Link href={transactionPath} className="e-font-mono">
                            {visibleText}
                        </Link>
                    ) : (
                        <span className="e-font-mono">{visibleText}</span>
                    )}
                </span>
            </Copyable>
        </div>
    );
}
