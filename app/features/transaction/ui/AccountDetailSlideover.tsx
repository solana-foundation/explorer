import { Button } from '@components/shared/ui/button';
import type { AccountInfo } from '@entities/account';
import type { ParsedMessage, ParsedMessageAccount } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, X } from 'react-feather';

import {
    Slideover,
    SlideoverBody,
    SlideoverClose,
    SlideoverContent,
    SlideoverTitle,
} from '@/app/components/shared/ui/slideover';
import { EditIcon, NicknameEditor, useNickname } from '@/app/features/nicknames';
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
                <SlideoverContent
                    aria-describedby={undefined}
                    className="border-t border-white/10 !bg-dk-gray-800-dark [border-top-style:solid]"
                    onEscapeKeyDown={handleEscapeKeyDown}
                >
                    <div className="space-y-1.5 p-4">
                        <div className="min-w-0 flex-1">
                            <SlideoverTitle className="mb-1.5 tracking-wide !text-outer-space-300">
                                Account {index + 1}
                            </SlideoverTitle>
                            <div className="break-all font-mono text-xl leading-snug text-white">
                                {nickname ?? address}
                            </div>
                            {nickname && <span className="break-all text-sm text-outer-space-300">{address}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <AccountBadges index={index} account={account} message={message} pubkey={pubkey} />
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <SlideoverBody className="border-t border-white/10 py-2 [border-top-style:solid]">
                        <AccountExpandedContent
                            accountInfo={accountInfo}
                            accountInfoLoading={accountInfoLoading}
                            address={address}
                            enabled={open}
                            flat
                        />
                    </SlideoverBody>

                    {/* Footer action bar */}
                    <div className="flex shrink-0 gap-2 border-t border-white/10 px-3 pb-6 pt-3 [border-top-style:solid]">
                        <Button className="w-1/4" onClick={() => setNicknameOpen(true)} size="tile" variant="outline">
                            <EditIcon width={16} />
                            Nickname
                        </Button>
                        <Button className="w-1/4" onClick={() => copy(address)} size="tile" variant="outline">
                            {copyState === 'copied' ? <CheckCircle size={16} /> : <Copy size={16} />}
                            Copy
                        </Button>
                        <Button asChild className="w-1/4" size="tile" variant="accent">
                            <Link href={addressPath} target="_blank">
                                <ExternalLink size={16} />
                                Open
                            </Link>
                        </Button>
                        <SlideoverClose asChild>
                            <Button className="w-1/4" size="tile" variant="outline">
                                <X size={16} />
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
