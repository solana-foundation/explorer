/* eslint-disable no-restricted-syntax, no-restricted-globals -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { TableCardBody } from '@components/common/TableCardBody';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { describe, vi } from 'vitest';

import * as mockExtensions from '@/app/__tests__/mock-parsed-extensions-stubs';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionRow } from '../TokenAccountSection';

vi.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'mainnet-beta',
    has: (_query?: string) => false,
    toString: () => '',
});

describe('TokenExtensionRow', () => {
    test('should render mintCloseAuthority extension', async () => {
        const data = {
            extension: 'mintCloseAuthority',
            state: {
                closeAuthority: gen.publicKey(1),
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText(/Close Authority/)).toBeInTheDocument();
        expect(screen.queryAllByText(new RegExp(`${data.state.closeAuthority.toString()}`))).toHaveLength(1);
    });

    test('should render transferFeeAmount extension', async () => {
        const data = {
            extension: 'transferFeeAmount',
            state: {
                withheldAmount: 1000000,
            },
        } as TokenExtension;

        renderRow(data, { symbol: 'TEST' });

        expect(await screen.findByText(/Withheld Amount \(TEST\)/)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should render transferFeeConfig extension', async () => {
        renderRow(mockExtensions.transferFeeConfig0, { epoch: 150n, symbol: 'TEST' });

        expect(await screen.findByText('Transfer Fee Config')).toBeInTheDocument();
        expect(screen.getByText(/Transfer Fee Authority/)).toBeInTheDocument();

        // Check for fee epoch labels within table cells
        const tableCells = screen.getAllByRole('cell');
        const feeEpochCells = tableCells.filter(cell => cell.textContent?.includes('Fee Epoch'));
        expect(feeEpochCells).toHaveLength(2);

        // Check for specific values
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
    });

    test('should render confidentialTransferMint extension', async () => {
        const data = {
            extension: 'confidentialTransferMint',
            state: {
                auditorElgamalPubkey: 'test-pubkey',
                authority: gen.publicKey(1),
                autoApproveNewAccounts: true,
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Confidential Transfer Mint')).toBeInTheDocument();
        expect(screen.getByText(/Authority/)).toBeInTheDocument();
        expect(screen.getByText(/Auditor Elgamal Pubkey/)).toBeInTheDocument();
        expect(screen.getByText('test-pubkey')).toBeInTheDocument();
        expect(screen.getByText('auto')).toBeInTheDocument();
    });

    test('should render confidentialTransferFeeConfig extension', async () => {
        const data = {
            extension: 'confidentialTransferFeeConfig',
            state: {
                authority: gen.publicKey(1),
                harvestToMintEnabled: true,
                withdrawWithheldAuthorityElgamalPubkey: 'test-pubkey',
                withheldAmount: '1000',
            },
        } as TokenExtension;

        renderRow(data, { symbol: 'TEST' });

        expect(await screen.findByText('Confidential Transfer Fee')).toBeInTheDocument();
        expect(screen.getByText(/Authority/)).toBeInTheDocument();
        expect(screen.getByText(/Auditor Elgamal Pubkey/)).toBeInTheDocument();
        expect(screen.getByText('test-pubkey')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
    });

    test.each<[TokenExtension['extension'], TokenExtension['state'], string, string]>([
        ['defaultAccountState', { accountState: 'frozen' }, 'DefaultAccountState', 'frozen'],
        ['nonTransferable', {}, 'Non-Transferable', 'enabled'],
        ['pausableAccount', {}, 'Pausable Account', 'enabled'],
        ['pausableConfig', { authority: gen.publicKey(1), paused: true }, 'Pausable Config', 'paused'],
        [
            'transferHook',
            { authority: gen.publicKey(2), programId: gen.publicKey(1) },
            'Transfer Hook Program Id',
            'Transfer Hook Authority',
        ],
        [
            'metadataPointer',
            { authority: gen.publicKey(2), metadataAddress: gen.publicKey(1) },
            'Metadata',
            'Metadata Pointer Authority',
        ],
        [
            'groupPointer',
            { authority: gen.publicKey(2), groupAddress: gen.publicKey(1) },
            'Token Group',
            'Group Pointer Authority',
        ],
        [
            'groupMemberPointer',
            { authority: gen.publicKey(2), memberAddress: gen.publicKey(1) },
            'Token Group Member',
            'Member Pointer Authority',
        ],
        ['cpiGuard', { lockCpi: true }, 'CPI Guard', 'enabled'],
        ['immutableOwner', {}, 'Immutable Owner', 'enabled'],
        ['memoTransfer', { requireIncomingTransferMemos: true }, 'Require Memo on Incoming Transfers', 'enabled'],
        ['transferHookAccount', { transferring: true }, 'Transfer Hook Status', 'transferring'],
        ['nonTransferableAccount', {}, 'Non-Transferable', 'enabled'],
        ['tokenGroupMember', { group: gen.publicKey(2), memberNumber: 1, mint: gen.publicKey(1) }, 'Group Member', '1'],
        ['unparseableExtension', {}, 'Unknown Extension', 'unparseable'],
    ])('should render %s extension', async (extension, state, title, value) => {
        renderRow({ extension, state });

        expect(await screen.findByText(title)).toBeInTheDocument();
        expect(screen.getByText(value)).toBeInTheDocument();
    });

    test('should render interestBearingConfig extension', async () => {
        const data = {
            extension: 'interestBearingConfig',
            state: {
                currentRate: 500,
                initializationTimestamp: 900000,
                lastUpdateTimestamp: 1000000,
                preUpdateAverageRate: 400,
                rateAuthority: gen.publicKey(1),
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Interest-Bearing')).toBeInTheDocument();
        expect(screen.getByText(/Authority/)).toBeInTheDocument();
        expect(screen.getByText('5%')).toBeInTheDocument();
        expect(screen.getByText('4%')).toBeInTheDocument();
    });

    test('should render scaledUiAmountConfig extension', async () => {
        const data = {
            extension: 'scaledUiAmountConfig',
            state: {
                authority: gen.publicKey(1),
                multiplier: '2',
                newMultiplier: '4.22',
                newMultiplierEffectiveTimestamp: 1743000000, // 2025-03-26 10:40:00
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Scaled UI Amount Config')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('4.22')).toBeInTheDocument();
    });

    test('should render permissionedBurnConfig extension', async () => {
        const data = {
            extension: 'permissionedBurnConfig',
            state: {
                authority: gen.publicKey(1),
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Permissioned Burn Authority')).toBeInTheDocument();
        expect(screen.queryAllByText(new RegExp(`${data.state.authority.toString()}`))).toHaveLength(1);
    });

    test('should render nothing for permissionedBurnConfig extension without an authority', async () => {
        const data = {
            extension: 'permissionedBurnConfig',
            state: {
                authority: null,
            },
        } as TokenExtension;

        renderRow(data);

        expect(screen.queryByText('Permissioned Burn Authority')).not.toBeInTheDocument();
    });

    test('should render permanentDelegate extension', async () => {
        const data = {
            extension: 'permanentDelegate',
            state: {
                delegate: gen.publicKey(1),
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Permanent Delegate')).toBeInTheDocument();
        expect(screen.queryAllByText(new RegExp(`${data.state.delegate.toString()}`))).toHaveLength(1);
    });

    test('should render tokenMetadata extension', async () => {
        const data = {
            extension: 'tokenMetadata',
            state: {
                additionalMetadata: [['key', 'value']],
                mint: gen.publicKey(1),
                name: 'Test Token',
                symbol: 'TEST',
                updateAuthority: gen.publicKey(2),
                uri: 'https://test.com',
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Test Token')).toBeInTheDocument();
        expect(screen.getByText('TEST')).toBeInTheDocument();
        expect(screen.getByText('https://test.com')).toBeInTheDocument();
        expect(screen.getByText('Additional Metadata')).toBeInTheDocument();
        expect(screen.getByText('key')).toBeInTheDocument();
        expect(screen.getByText('value')).toBeInTheDocument();
    });

    test('should render confidentialTransferAccount extension', async () => {
        const data = {
            extension: 'confidentialTransferAccount',
            state: {
                actualPendingBalanceCreditCounter: 1,
                allowConfidentialCredits: true,
                allowNonConfidentialCredits: true,
                approved: true,
                availableBalance: '1000',
                decryptableAvailableBalance: '900',
                elgamalPubkey: 'test-pubkey',
                expectedPendingBalanceCreditCounter: 1,
                maximumPendingBalanceCreditCounter: 10,
                pendingBalanceCreditCounter: 1,
                pendingBalanceHi: '0',
                pendingBalanceLo: '100',
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Confidential Transfer Account')).toBeInTheDocument();
        expect(screen.getByText('approved')).toBeInTheDocument();
        expect(screen.getByText('test-pubkey')).toBeInTheDocument();
        expect(screen.getByText(/Confidential Credits/)).toBeInTheDocument();
        expect(screen.getByText(/Non-confidential Credits/)).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('900')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();

        // Check credit counter elements with their specific values
        const creditCounterElements = screen.getAllByText(/Credit Counter/);
        expect(creditCounterElements).toHaveLength(4);

        // Check maximum pending balance credit counter specifically
        const maxCounterElement = screen.getByText(/Maximum Pending Balance Credit Counter/);
        // eslint-disable-next-line testing-library/no-node-access
        expect(maxCounterElement.closest('tr')).toHaveTextContent('10');
    });

    test('should render confidentialTransferFeeAmount extension', async () => {
        const data = {
            extension: 'confidentialTransferFeeAmount',
            state: {
                withheldAmount: '1000',
            },
        } as TokenExtension;

        renderRow(data, { symbol: 'TEST' });

        expect(await screen.findByText(/Encrypted Withheld Amount \(TEST\)/)).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
    });

    test('should render tokenGroup extension', async () => {
        const data = {
            extension: 'tokenGroup',
            state: {
                maxSize: 100,
                mint: gen.publicKey(1),
                size: 10,
                updateAuthority: gen.publicKey(2),
            },
        } as TokenExtension;

        renderRow(data);

        expect(await screen.findByText('Group')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });
});

function renderRow(data: TokenExtension, { epoch, symbol }: { epoch?: bigint; symbol?: string } = {}) {
    render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <AccountsProvider>
                    <TableCardBody>{TokenExtensionRow(data, epoch, 6, symbol)}</TableCardBody>
                </AccountsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}
