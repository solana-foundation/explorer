'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { cn } from '@shared/utils';
import { TransactionSignature } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';

import { Copyable } from './Copyable';
import { useMidTruncation } from './useMidTruncation';

type Props = {
    signature: TransactionSignature;
    alignRight?: boolean;
    link?: boolean;
    noTruncate?: boolean;
};

export function Signature({ signature, alignRight, link, noTruncate }: Props) {
    const transactionPath = useClusterPath({ pathname: `/tx/${signature}` });
    const { rowRef, hiddenTextRef, isMidTruncated, midTruncatedText } = useMidTruncation(!noTruncate, signature);

    const visibleText = isMidTruncated ? midTruncatedText : signature;

    return (
        <div
            ref={rowRef}
            className={cn(
                'e-relative e-flex e-w-full e-min-w-0 e-items-center e-justify-start',
                alignRight && 'e-justify-end',
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="e-relative e-min-w-0 e-overflow-hidden e-font-mono">
                            {link ? (
                                <Link href={transactionPath} className="e-font-mono">
                                    {visibleText}
                                </Link>
                            ) : (
                                <span className="e-font-mono">{visibleText}</span>
                            )}
                        </span>
                    </TooltipTrigger>
                    {isMidTruncated && (
                        <TooltipContent className="e-max-w-[min(320px,90vw)]">
                            <span className="e-break-all e-font-mono">{signature}</span>
                        </TooltipContent>
                    )}
                </Tooltip>
            </Copyable>
        </div>
    );
}
