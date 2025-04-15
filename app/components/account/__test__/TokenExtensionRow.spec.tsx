import { TableCardBody } from '@components/common/TableCardBody';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { describe, vi } from 'vitest';

import * as mockExtensions from '@/app/__tests__/mock-parsed-extensions-stubs';
import { sleep } from '@/app/__tests__/mocks';
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
    // sleep to allow not facing 429s
    beforeEach(async () => await sleep());

    test('should render mintCloseAuthority extension', async () => {
        const data = {
            extension: 'mintCloseAuthority',
            state: {
                closeAuthority: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText(/Close Authority/)).toBeInTheDocument();
        expect(screen.queryAllByText(new RegExp(`${data.state.closeAuthority.toString()}`))).toHaveLength(2);
    });

    test('should render transferFeeAmount extension', async () => {
        const data = {
            extension: 'transferFeeAmount',
            state: {
                withheldAmount: 1000000,
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, 'TEST')}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText(/Withheld Amount \(TEST\)/)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should render transferFeeConfig extension', async () => {
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>
                            {TokenExtensionRow(mockExtensions.transferFeeConfig0, 150n, 6, 'TEST')}
                        </TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

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
                authority: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                autoApproveNewAccounts: true,
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Confidential Transfer')).toBeInTheDocument();
        expect(screen.getByText(/Authority/)).toBeInTheDocument();
        expect(screen.getByText(/Auditor Elgamal Pubkey/)).toBeInTheDocument();
        expect(screen.getByText('test-pubkey')).toBeInTheDocument();
        expect(screen.getByText('auto')).toBeInTheDocument();
    });

    test('should render confidentialTransferFeeConfig extension', async () => {
        const data = {
            extension: 'confidentialTransferFeeConfig',
            state: {
                authority: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                harvestToMintEnabled: true,
                withdrawWithheldAuthorityElgamalPubkey: 'test-pubkey',
                withheldAmount: '1000',
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, 'TEST')}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Confidential Transfer Fee')).toBeInTheDocument();
        expect(screen.getByText(/Authority/)).toBeInTheDocument();
        expect(screen.getByText(/Auditor Elgamal Pubkey/)).toBeInTheDocument();
        expect(screen.getByText('test-pubkey')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
    });

    test('should render defaultAccountState extension', async () => {
        const data = {
            extension: 'defaultAccountState',
            state: {
                accountState: 'frozen',
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('DefaultAccountState')).toBeInTheDocument();
        expect(screen.getByText('frozen')).toBeInTheDocument();
    });

    test('should render nonTransferable extension', async () => {
        const data = {
            extension: 'nonTransferable',
            state: {},
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Non-Transferable')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
    });

    test('should render interestBearingConfig extension', async () => {
        const data = {
            extension: 'interestBearingConfig',
            state: {
                currentRate: 500,
                initializationTimestamp: 900000,
                lastUpdateTimestamp: 1000000,
                preUpdateAverageRate: 400,
                rateAuthority: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Interest-Bearing')).toBeInTheDocument();
        expect(screen.getByText(/Authority/)).toBeInTheDocument();
        expect(screen.getByText('5%')).toBeInTheDocument();
        expect(screen.getByText('4%')).toBeInTheDocument();
    });

    test('should render permanentDelegate extension', async () => {
        const data = {
            extension: 'permanentDelegate',
            state: {
                delegate: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Permanent Delegate')).toBeInTheDocument();
        expect(screen.queryAllByText(new RegExp(`${data.state.delegate.toString()}`))).toHaveLength(2);
    });

    test('should render transferHook extension', async () => {
        const data = {
            extension: 'transferHook',
            state: {
                authority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                programId: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Transfer Hook Program Id')).toBeInTheDocument();
        expect(screen.getByText('Transfer Hook Authority')).toBeInTheDocument();
    });

    test('should render metadataPointer extension', async () => {
        const data = {
            extension: 'metadataPointer',
            state: {
                authority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                metadataAddress: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Metadata Pointer Authority')).toBeInTheDocument();
    });

    test('should render groupPointer extension', async () => {
        const data = {
            extension: 'groupPointer',
            state: {
                authority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                groupAddress: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Token Group')).toBeInTheDocument();
        expect(screen.getByText('Group Pointer Authority')).toBeInTheDocument();
    });

    test('should render groupMemberPointer extension', async () => {
        const data = {
            extension: 'groupMemberPointer',
            state: {
                authority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                memberAddress: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Token Group Member')).toBeInTheDocument();
        expect(screen.getByText('Member Pointer Authority')).toBeInTheDocument();
    });

    test('should render tokenMetadata extension', async () => {
        const data = {
            extension: 'tokenMetadata',
            state: {
                additionalMetadata: [['key', 'value']],
                mint: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                name: 'Test Token',
                symbol: 'TEST',
                updateAuthority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                uri: 'https://test.com',
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Test Token')).toBeInTheDocument();
        expect(screen.getByText('TEST')).toBeInTheDocument();
        expect(screen.getByText('https://test.com')).toBeInTheDocument();
        expect(screen.getByText('Additional Metadata')).toBeInTheDocument();
        expect(screen.getByText('key')).toBeInTheDocument();
        expect(screen.getByText('value')).toBeInTheDocument();
    });

    test('should render cpiGuard extension', async () => {
        const data = {
            extension: 'cpiGuard',
            state: {
                lockCpi: true,
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('CPI Guard')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
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

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Confidential Transfer')).toBeInTheDocument();
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

    test('should render immutableOwner extension', async () => {
        const data = {
            extension: 'immutableOwner',
            state: {},
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Immutable Owner')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
    });

    test('should render memoTransfer extension', async () => {
        const data = {
            extension: 'memoTransfer',
            state: {
                requireIncomingTransferMemos: true,
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Require Memo on Incoming Transfers')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
    });

    test('should render transferHookAccount extension', async () => {
        const data = {
            extension: 'transferHookAccount',
            state: {
                transferring: true,
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Transfer Hook Status')).toBeInTheDocument();
        expect(screen.getByText('transferring')).toBeInTheDocument();
    });

    test('should render nonTransferableAccount extension', async () => {
        const data = {
            extension: 'nonTransferableAccount',
            state: {},
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Non-Transferable')).toBeInTheDocument();
        expect(screen.getByText('enabled')).toBeInTheDocument();
    });

    test('should render confidentialTransferFeeAmount extension', async () => {
        const data = {
            extension: 'confidentialTransferFeeAmount',
            state: {
                withheldAmount: '1000',
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, 'TEST')}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText(/Encrypted Withheld Amount \(TEST\)/)).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
    });

    test('should render tokenGroup extension', async () => {
        const data = {
            extension: 'tokenGroup',
            state: {
                maxSize: 100,
                mint: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                size: 10,
                updateAuthority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Group')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('should render tokenGroupMember extension', async () => {
        const data = {
            extension: 'tokenGroupMember',
            state: {
                group: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
                memberNumber: 1,
                mint: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
            },
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Group Member')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should render unparseableExtension extension', async () => {
        const data = {
            extension: 'unparseableExtension',
            state: {},
        } as TokenExtension;

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AccountsProvider>
                        <TableCardBody>{TokenExtensionRow(data, undefined, 6, undefined)}</TableCardBody>
                    </AccountsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        expect(await screen.findByText('Unknown Extension')).toBeInTheDocument();
        expect(screen.getByText('unparseable')).toBeInTheDocument();
    });
});
