import { type ParsedMessage, PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccountDetailSlideover } from '../AccountDetailSlideover';

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: ComponentProps<'a'> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/app/features/nicknames', () => ({
    NicknameEditor: ({ address, onClose }: { address: string; onClose: () => void }) => (
        <div>
            <input
                aria-label={`Nickname input for ${address}`}
                autoFocus
                onKeyDown={event => {
                    if (event.key === 'Escape') onClose();
                }}
            />
        </div>
    ),
    useNickname: vi.fn(() => null),
}));

vi.mock('@/app/shared/lib/useCopyToClipboard', () => ({
    useCopyToClipboard: () => ['idle', vi.fn()] as const,
}));

vi.mock('@utils/url', () => ({
    useClusterPath: () => '/address/test',
}));

vi.mock('../AccountBadges', () => ({
    AccountBadges: () => <div>Account badges</div>,
}));

vi.mock('../AccountExpandedContent', () => ({
    AccountExpandedContent: () => <div>Account expanded content</div>,
}));

afterEach(() => {
    vi.clearAllMocks();
});

const pubkey = new PublicKey('11111111111111111111111111111111');

describe('AccountDetailSlideover', () => {
    it('should close the slideover on Escape when the nickname editor is closed', () => {
        const onOpenChange = vi.fn();

        renderSlideover({ onOpenChange });
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should keep the slideover open when Escape closes the nickname editor', () => {
        const onOpenChange = vi.fn();

        renderSlideover({ onOpenChange });
        fireEvent.click(screen.getByRole('button', { name: 'Nickname' }));

        const input = screen.getByLabelText(`Nickname input for ${pubkey.toBase58()}`);
        fireEvent.keyDown(input, { key: 'Escape' });

        expect(screen.queryByLabelText(`Nickname input for ${pubkey.toBase58()}`)).not.toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
    });
});

function renderSlideover({ onOpenChange = vi.fn() }: { onOpenChange?: (open: boolean) => void } = {}) {
    render(
        <AccountDetailSlideover
            account={{
                pubkey,
                signer: false,
                source: 'transaction',
                writable: false,
            }}
            accountInfoLoading={false}
            index={0}
            message={{} as ParsedMessage}
            onOpenChange={onOpenChange}
            open
        />,
    );
}
