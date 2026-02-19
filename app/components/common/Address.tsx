'use client';

import { Connection, programs } from '@metaplex/js';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { displayAddress, TokenLabelInfo } from '@utils/tx';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import { useTokenInfo } from '@/app/entities/token-info';
import { EditIcon, NicknameEditor, useNickname } from '@/app/features/nicknames';

import { Copyable } from './Copyable';

type Props = {
    pubkey: PublicKey;
    alignRight?: boolean;
    link?: boolean;
    raw?: boolean;
    truncate?: boolean;
    truncateUnknown?: boolean;
    truncateChars?: number;
    useMetadata?: boolean;
    overrideText?: string;
    tokenLabelInfo?: TokenLabelInfo;
    fetchTokenLabelInfo?: boolean;
};

export function Address({
    pubkey,
    alignRight,
    link,
    raw,
    truncate,
    truncateUnknown,
    truncateChars,
    useMetadata,
    overrideText,
    tokenLabelInfo,
    fetchTokenLabelInfo,
}: Props) {
    const address = pubkey.toBase58();
    const { cluster, clusterInfo } = useCluster();
    const addressPath = useClusterPath({ pathname: `/address/${address}` });
    const [showNicknameEditor, setShowNicknameEditor] = useState(false);
    const nickname = useNickname(address);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!fetchTokenLabelInfo) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { rootMargin: '50px' }
        );

        const currentContainer = containerRef.current;
        if (currentContainer) {
            observer.observe(currentContainer);
        }

        return () => {
            if (currentContainer) {
                observer.unobserve(currentContainer);
            }
        };
    }, [fetchTokenLabelInfo]);

    const display = displayAddress(address, cluster, tokenLabelInfo);
    if (truncateUnknown && address === display) {
        truncate = true;
    }

    let addressLabel = raw ? address : display;

    const metaplexData = useTokenMetadata(useMetadata, address);
    if (metaplexData && metaplexData.data) {
        addressLabel = metaplexData.data.data.name;
    }

    const shouldFetchTokenInfo = fetchTokenLabelInfo && isVisible;
    const tokenInfo = useTokenInfo(shouldFetchTokenInfo, address, cluster, clusterInfo?.genesisHash);
    if (tokenInfo) {
        addressLabel = displayAddress(address, cluster, tokenInfo);
    }

    if (truncateChars && addressLabel === address) {
        addressLabel = addressLabel.slice(0, truncateChars) + '…';
    }

    if (overrideText) {
        addressLabel = overrideText;
    }

    // Prepend nickname if exists
    const displayText = nickname ? `"${nickname}" (${addressLabel})` : addressLabel;

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

    const content = (
        <div className="d-flex align-items-center gap-2">
            <Copyable text={address}>
                <span
                    data-address={address}
                    className="font-monospace"
                    onMouseEnter={() => handleMouseEnter(address)}
                    onMouseLeave={() => handleMouseLeave(address)}
                    title={nickname ? displayText : undefined}
                >
                    {link ? (
                        <Link
                            className={truncate || nickname ? 'text-truncate address-truncate' : ''}
                            href={addressPath}
                        >
                            {displayText}
                        </Link>
                    ) : (
                        <span className={truncate || nickname ? 'text-truncate address-truncate' : ''}>
                            {displayText}
                        </span>
                    )}
                </span>
            </Copyable>
            <button
                className="btn btn-sm btn-link p-0 text-muted"
                onClick={() => setShowNicknameEditor(true)}
                title="Edit nickname"
                style={{ fontSize: '0.875rem', lineHeight: 1 }}
            >
                <EditIcon />
            </button>
            {showNicknameEditor && <NicknameEditor address={address} onClose={() => setShowNicknameEditor(false)} />}
        </div>
    );

    return (
        <div ref={containerRef}>
            <div
                className={`d-none d-lg-flex align-items-center ${alignRight ? 'justify-content-end' : ''}`}
            >
                {content}
            </div>
            <div className="d-flex d-lg-none align-items-center">{content}</div>
        </div>
    );
}
const useTokenMetadata = (useMetadata: boolean | undefined, pubkey: string) => {
    const [data, setData] = useState<programs.metadata.MetadataData>();
    const { url } = useCluster();

    useAsyncEffect(
        async isMounted => {
            if (!useMetadata) return;
            if (pubkey && !data) {
                try {
                    const pda = await programs.metadata.Metadata.getPDA(pubkey);
                    const connection = new Connection(url);
                    const metadata = await programs.metadata.Metadata.load(connection, pda);
                    if (isMounted()) {
                        setData(metadata.data);
                    }
                } catch {
                    if (isMounted()) {
                        setData(undefined);
                    }
                }
            }
        },
        [useMetadata, pubkey, url, data, setData]
    );
    return { data };
};
