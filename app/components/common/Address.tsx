'use client';

import { useTokenMetadata } from '@entities/nft';
import { useTokenInfo } from '@entities/token-info';
import { useCluster } from '@providers/cluster';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { cn } from '@shared/utils';
import { PublicKey } from '@solana/web3.js';
import { displayAddress, TokenLabelInfo } from '@utils/tx';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

import { EditIcon, NicknameEditor, useNickname } from '@/app/features/nicknames';
import { useVisibility } from '@/app/shared/lib/visibility';

import { Copyable } from './Copyable';
import { useMidTruncation } from './useMidTruncation';

type Props = {
    pubkey: PublicKey;
    alignRight?: boolean;
    link?: boolean;
    raw?: boolean;
    noTruncate?: boolean;
    useMetadata?: boolean;
    overrideText?: string;
    tokenLabelInfo?: TokenLabelInfo;
    fetchTokenLabelInfo?: boolean;
    'aria-label'?: string;
};

export function Address({
    pubkey,
    alignRight,
    link,
    raw,
    noTruncate,
    useMetadata,
    overrideText,
    tokenLabelInfo,
    fetchTokenLabelInfo,
    'aria-label': ariaLabel,
}: Props) {
    const address = pubkey.toBase58();
    const { cluster, clusterInfo } = useCluster();
    const addressPath = useClusterPath({ pathname: `/address/${address}` });
    const [showNicknameEditor, setShowNicknameEditor] = useState(false);
    const nickname = useNickname(address);
    const { ref: visibilityRef, isVisible } = useVisibility(fetchTokenLabelInfo);

    const display = displayAddress(address, cluster, tokenLabelInfo);

    let addressLabel = raw ? address : display;

    const metaplexData = useTokenMetadata(useMetadata, address);
    if (metaplexData && metaplexData.data) {
        addressLabel = metaplexData.data.name;
    }

    const shouldFetchTokenInfo = fetchTokenLabelInfo && isVisible;
    const tokenInfo = useTokenInfo(shouldFetchTokenInfo, address, cluster, clusterInfo?.genesisHash);
    if (tokenInfo) {
        addressLabel = displayAddress(address, cluster, tokenInfo);
    }

    if (overrideText) {
        addressLabel = overrideText;
    }

    const displayText = nickname ? `"${nickname}" (${addressLabel})` : addressLabel;

    // Mid-truncation applies only to raw 44-char addresses (no nickname, no human-readable label)
    const isMidTruncateCandidate = !noTruncate && !nickname && !overrideText && addressLabel === address;

    const editBtnRef = useRef<HTMLButtonElement>(null);
    const { rowRef, hiddenTextRef, isMidTruncated, midTruncatedText } = useMidTruncation(
        isMidTruncateCandidate,
        address,
        editBtnRef,
    );

    const handleMouseEnter = (text: string) => {
        const elements = document.querySelectorAll(`[data-address="${text}"]`);
        elements.forEach(el => {
            (el as HTMLElement).classList.add('address-highlight');
        });
    };

    const handleMouseLeave = (text: string) => {
        const elements = document.querySelectorAll(`[data-address="${text}"]`);
        elements.forEach(el => {
            (el as HTMLElement).classList.remove('address-highlight');
        });
    };

    const visibleText = isMidTruncated ? midTruncatedText : displayText;

    // Nickname uses CSS text-overflow truncation (trailing ellipsis)
    const innerTextClassName = cn('e-font-mono', nickname && 'e-truncate');

    const innerContent = link ? (
        <Link href={addressPath} className={innerTextClassName}>
            {visibleText}
        </Link>
    ) : (
        <span className={innerTextClassName}>{visibleText}</span>
    );

    return (
        <span ref={visibilityRef} className="e-block e-w-full">
            <div
                ref={rowRef}
                className={cn('e-relative e-flex e-w-full e-min-w-0 e-items-center', alignRight && 'md:e-justify-end')}
                aria-label={ariaLabel}
            >
                {/* Hidden span for measuring the natural text width — absolutely positioned so it doesn't affect layout */}
                {isMidTruncateCandidate && (
                    <span
                        ref={hiddenTextRef}
                        className="e-pointer-events-none e-invisible e-absolute e-whitespace-nowrap e-font-mono"
                        aria-hidden
                    >
                        {displayText}
                    </span>
                )}
                <Copyable text={address}>
                    {isMidTruncateCandidate ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span
                                    data-address={address}
                                    className="e-relative e-min-w-0 e-overflow-hidden e-font-mono"
                                    onMouseEnter={() => handleMouseEnter(address)}
                                    onMouseLeave={() => handleMouseLeave(address)}
                                >
                                    {innerContent}
                                </span>
                            </TooltipTrigger>
                            {isMidTruncated && (
                                <TooltipContent>
                                    <span className="e-font-mono">{address}</span>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ) : (
                        <span
                            data-address={address}
                            className="e-relative e-min-w-0 e-overflow-hidden e-font-mono"
                            onMouseEnter={() => handleMouseEnter(address)}
                            onMouseLeave={() => handleMouseLeave(address)}
                            title={nickname ? displayText : undefined}
                        >
                            {innerContent}
                        </span>
                    )}
                </Copyable>
                <button
                    ref={editBtnRef}
                    className="e-ms-2 e-flex-none e-shrink-0 e-cursor-pointer e-border-0 e-bg-transparent e-p-0 e-text-muted"
                    onClick={() => setShowNicknameEditor(true)}
                    title="Edit nickname"
                    style={{ fontSize: '0.875rem', lineHeight: 1 }}
                >
                    <EditIcon />
                </button>
                {showNicknameEditor && (
                    <NicknameEditor address={address} onClose={() => setShowNicknameEditor(false)} />
                )}
            </div>
        </span>
    );
}
