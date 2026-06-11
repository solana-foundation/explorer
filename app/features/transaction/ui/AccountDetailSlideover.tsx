'use client';

import type { AccountInfo } from '@entities/account';
import { Button } from '@shared/ui/button';
import type { ParsedMessage, ParsedMessageAccount } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Tag, X } from 'react-feather';

import {
    Slideover,
    SlideoverBody,
    SlideoverClose,
    SlideoverContent,
    SlideoverTitle,
} from '@/app/components/shared/ui/slideover';
import { NicknameEditor, useNickname } from '@/app/features/nicknames';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { AccountBadges } from './AccountBadges';
import { AccountExpandedContent } from './AccountExpandedContent';

type Props = {
    account: ParsedMessageAccount;
    accountInfo?: AccountInfo;
    accountInfoLoading: boolean;
    index: number;
    message: ParsedMessage;
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export function AccountDetailSlideover({
    account,
    accountInfo,
    accountInfoLoading,
    index,
    message,
    onOpenChange,
    open,
}: Props) {
    const pubkey = account.pubkey;
    const address = pubkey.toBase58();
    const nickname = useNickname(address);
    const [nicknameOpen, setNicknameOpen] = useState(false);
    const [copyState, copy] = useCopyToClipboard(1500);
    const addressPath = useClusterPath({ pathname: `/address/${address}` });

    return (
        <>
            <Slideover open={open} onOpenChange={onOpenChange}>
                <SlideoverContent aria-describedby={undefined}>
                    <div className="e-space-y-2 e-px-4 e-pb-3 e-pt-4">
                        <div className="e-min-w-0 e-flex-1">
                            <SlideoverTitle className="e-mb-1.5 e-tracking-wide !e-text-outer-space-300">
                                Account {index + 1}
                            </SlideoverTitle>
                            <div className="e-break-all e-font-mono e-text-xl e-leading-snug e-text-white">
                                {nickname ?? address}
                            </div>
                        </div>
                        <div className="e-flex">
                            <AccountBadges index={index} account={account} message={message} pubkey={pubkey} />
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <SlideoverBody className="e-border-t e-border-white/10 e-pt-2 [border-top-style:solid]">
                        <AccountExpandedContent
                            accountInfo={accountInfo}
                            accountInfoLoading={accountInfoLoading}
                            address={address}
                            enabled={open}
                            flat
                        />
                    </SlideoverBody>

                    {/* Footer action bar */}
                    <div className="e-flex e-shrink-0 e-gap-2 e-p-3">
                        <Button
                            className="e-flex e-h-16 e-w-1/4 e-flex-col e-gap-1.5"
                            onClick={() => setNicknameOpen(true)}
                            size="sm"
                            variant="outline"
                        >
                            <Tag size={13} />
                            Nickname
                        </Button>
                        <Button
                            className="e-flex e-h-16 e-w-1/4 e-flex-col e-gap-1.5"
                            onClick={() => copy(address)}
                            size="sm"
                            variant="outline"
                        >
                            {copyState === 'copied' ? <CheckCircle size={13} /> : <Copy size={13} />}
                            Copy
                        </Button>
                        <Button
                            asChild
                            className="e-flex e-h-16 e-w-1/4 e-flex-col e-gap-1.5"
                            size="sm"
                            variant="accent"
                        >
                            <Link href={addressPath} target="_blank">
                                <ExternalLink size={13} />
                                Open
                            </Link>
                        </Button>
                        <SlideoverClose asChild>
                            <Button className="e-flex e-h-16 e-w-1/4 e-flex-col e-gap-1.5" size="sm" variant="outline">
                                <X size={13} />
                                Close
                            </Button>
                        </SlideoverClose>
                    </div>
                    {nicknameOpen && <NicknameEditor address={address} onClose={() => setNicknameOpen(false)} />}
                </SlideoverContent>
            </Slideover>
        </>
    );
}
