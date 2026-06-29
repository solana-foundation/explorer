import { Button } from '@components/shared/ui/button';
import type { AccountInfo } from '@entities/account';
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
    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) setNicknameOpen(false);
        onOpenChange(nextOpen);
    };
    const handleEscapeKeyDown = (event: KeyboardEvent) => {
        if (!nicknameOpen) return;

        // NicknameEditor uses Escape to cancel editing. Prevent Radix from also
        // dismissing the parent slideover from its capture-phase document listener.
        event.preventDefault();
    };

    return (
        <>
            <Slideover open={open} onOpenChange={handleOpenChange}>
                <SlideoverContent aria-describedby={undefined} onEscapeKeyDown={handleEscapeKeyDown}>
                    <div className="space-y-2 px-4 pb-3 pt-4">
                        <div className="min-w-0 flex-1">
                            <SlideoverTitle className="mb-1.5 tracking-wide !text-outer-space-300">
                                Account {index + 1}
                            </SlideoverTitle>
                            <div className="break-all font-mono text-xl leading-snug text-white">
                                {nickname ?? address}
                            </div>
                            {nickname && <span className="break-all text-sm text-outer-space-300">{address}</span>}
                        </div>
                        <div className="flex">
                            <AccountBadges index={index} account={account} message={message} pubkey={pubkey} />
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <SlideoverBody className="border-t border-white/10 pt-2 [border-top-style:solid]">
                        <AccountExpandedContent
                            accountInfo={accountInfo}
                            accountInfoLoading={accountInfoLoading}
                            address={address}
                            enabled={open}
                            flat
                        />
                    </SlideoverBody>

                    {/* Footer action bar */}
                    <div className="flex shrink-0 gap-2 p-3 pb-6">
                        <Button
                            className="flex !h-16 w-1/4 flex-col gap-1.5"
                            onClick={() => setNicknameOpen(true)}
                            size="sm"
                            variant="outline"
                        >
                            <Tag size={13} />
                            Nickname
                        </Button>
                        <Button
                            className="flex !h-16 w-1/4 flex-col gap-1.5"
                            onClick={() => copy(address)}
                            size="sm"
                            variant="outline"
                        >
                            {copyState === 'copied' ? <CheckCircle size={13} /> : <Copy size={13} />}
                            Copy
                        </Button>
                        <Button asChild className="flex !h-16 w-1/4 flex-col gap-1.5" size="sm" variant="accent">
                            <Link href={addressPath} target="_blank">
                                <ExternalLink size={13} />
                                Open
                            </Link>
                        </Button>
                        <SlideoverClose asChild>
                            <Button className="flex !h-16 w-1/4 flex-col gap-1.5" size="sm" variant="outline">
                                <X size={13} />
                                Close
                            </Button>
                        </SlideoverClose>
                    </div>
                </SlideoverContent>
            </Slideover>
            <NicknameEditor address={address} open={nicknameOpen} onClose={() => setNicknameOpen(false)} />
        </>
    );
}
