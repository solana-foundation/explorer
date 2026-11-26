import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { populatePartialParsedTokenExtension } from '@/app/utils/token-extension';
import type { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionsSection } from '../TokenExtensionsSection';
import type { ParsedTokenExtension } from '../types';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));
vi.mock('@providers/cluster', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/cluster')>()),
    useEpochInfo: () => ({
        absoluteSlot: 474_229_603n,
        blockHeight: 452_000_000n,
        epoch: 1097n,
        slotIndex: 331_603n,
        slotsInEpoch: 432_000n,
    }),
}));

// Mainnet mint CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo as `getAccountInfo` returns it in epoch 1097.
const MINT = 'CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo';
const TRANSFER_FEE_CONFIG = {
    extension: 'transferFeeConfig',
    state: {
        newerTransferFee: { epoch: 698, maximumFee: 3906250000000000000, transferFeeBasisPoints: 269 },
        olderTransferFee: { epoch: 624, maximumFee: 3906250000000000000, transferFeeBasisPoints: 420 },
        transferFeeConfigAuthority: 'BeRNwDN8aGHvxYRVhNyMkF1wsxuEeceux2xn5deFWyEe',
        withdrawWithheldAuthority: 'BeRNwDN8aGHvxYRVhNyMkF1wsxuEeceux2xn5deFWyEe',
        withheldAmount: 507729731,
    },
} as TokenExtension;

describe('TokenExtensionsSection', () => {
    it('should label the transfer fee that applies in the current epoch as current', async () => {
        renderSection([TRANSFER_FEE_CONFIG]);

        fireEvent.click(screen.getByText('Transfer Fee Config'));

        expect(await screen.findByText('Current Fee Rate')).toBeInTheDocument();
        expect(rowValue('Current Fee Rate')).toBe('2.69%');
        expect(rowValue('Current Fee Epoch')).toBe('698');
        expect(rowValue('Previous Fee Rate')).toBe('4.2%');
        expect(rowValue('Previous Fee Epoch')).toBe('624');
        expect(screen.queryByText('Future Fee Rate')).not.toBeInTheDocument();
    });
});

function rowValue(label: string) {
    const cell = screen.getByText(label);
    return cell.closest('tr')?.lastElementChild?.textContent;
}

function renderSection(extensions: TokenExtension[]) {
    const parsedExtensions: ParsedTokenExtension[] = extensions.map(({ extension, state }) => ({
        ...populatePartialParsedTokenExtension(extension),
        extension,
        parsed: state,
    }));

    render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <AccountsProvider>
                    <TokenExtensionsSection
                        address={MINT}
                        decimals={5}
                        extensions={extensions}
                        parsedExtensions={parsedExtensions}
                        symbol="BERN"
                    />
                </AccountsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}
