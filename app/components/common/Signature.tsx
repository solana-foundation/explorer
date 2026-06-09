'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { cn } from '@shared/utils';
import { TransactionSignature } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';

import { Copyable } from './Copyable';
import { useMidTruncation } from './useMidTruncation';

const signatureVariants = cva('e-relative e-flex e-w-full e-min-w-0 e-justify-start', {
    defaultVariants: {
        alignItems: 'center',
        alignRight: false,
    },
    variants: {
        alignItems: {
            center: 'e-items-center',
            start: 'e-items-start',
        },
        alignRight: {
            false: '',
            true: 'lg:e-justify-end',
        },
    },
});

type Props = {
    signature: TransactionSignature;
    alignItems?: 'center' | 'start';
    alignRight?: boolean;
    className?: string;
    link?: boolean;
    noTruncate?: boolean;
} & Omit<VariantProps<typeof signatureVariants>, 'alignItems' | 'alignRight'>;

export function Signature({ signature, alignItems, alignRight, className, link, noTruncate }: Props) {
    const transactionPath = useClusterPath({ pathname: `/tx/${signature}` });
    const { rowRef, hiddenTextRef, isMidTruncated, midTruncatedText } = useMidTruncation(!noTruncate, signature);

    const visibleText = isMidTruncated ? midTruncatedText : signature;

    return (
        <div ref={rowRef} className={cn(signatureVariants({ alignItems, alignRight: Boolean(alignRight) }), className)}>
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
