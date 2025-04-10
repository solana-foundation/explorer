'use client';

import { AccountHeader } from '@components/common/Account';
import { useFetchAccountInfo } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { useMemo } from 'react';
import useSWR from 'swr';

import { getTokenInfo, getTokenInfoSwrKey } from '@/app/utils/token-info';
import { TokenExtension, TokenExtensionType } from '@/app/validators/accounts/token-extension';

import { LoadingCard } from '../common/LoadingCard';
import { TokenExtensionsSection } from './TokenExtensionsSection';
import { ParsedTokenExtension } from './types';

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await getTokenInfo(new PublicKey(address), cluster, url);
}

export function TokenExtensionsCard({
    address,
    extensions: mintExtensions,
}: {
    address: string;
    extensions: TokenExtension[];
}) {
    const { cluster, url } = useCluster();
    const refresh = useFetchAccountInfo();
    const swrKey = useMemo(() => getTokenInfoSwrKey(address, cluster, url), [address, cluster, url]);
    const { data: tokenInfo, isLoading } = useSWR(swrKey, fetchTokenInfo);

    const extensions = populateTokenExtensions(mintExtensions);

    // check for nullish decimals to satisty constraint for required decimals.
    if (isLoading) {
        return <LoadingCard />;
    } else if (!tokenInfo || tokenInfo.decimals === null) {
        throw new Error('Can not fetch token info.');
    }

    return (
        <div className="card">
            <AccountHeader title="Extensions" refresh={() => refresh(new PublicKey(address), 'parsed')} />
            <div className="card-body p-0 e-overflow-x-scroll">
                <TokenExtensionsSection
                    decimals={tokenInfo.decimals}
                    extensions={mintExtensions}
                    parsedExtensions={extensions}
                    symbol={tokenInfo.symbol}
                />
            </div>
        </div>
    );
}

function populateTokenExtensions(extensions: TokenExtension[]): ParsedTokenExtension[] {
    const result = extensions.reduce((acc, { extension, state }) => {
        const data = populatePartialParsedTokenExtension(extension);
        acc.set(extension, {
            ...data,
            extension: extension,
            parsed: state,
        });

        return acc;
    }, new Map<string, ParsedTokenExtension>());

    return Array.from(result.values());
}

function populateSolanaDevelopersLink(component: string) {
    return `https://solana.com/developers/guides/token-extensions/${component}`;
}

function populatePartialParsedTokenExtension(
    extension: TokenExtensionType
): Omit<ParsedTokenExtension, 'parsed' | 'extension'> {
    function populateExternalLinks(url: string) {
        return [{ label: 'Docs', url }];
    }

    switch (extension) {
        case 'transferFeeAmount': {
            const description =
                "Every transfer sets aside a fee in the recipient's Token Account that can only be withdrawn by the Withdraw Authority";
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-fee')),
                name: 'Transfer Fee Amount',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'mintCloseAuthority': {
            const description = 'Allows a designated Close Authority to close the mint account if the supply is 0';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('mint-close-authority')),
                name: 'Mint Close Authority',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'defaultAccountState': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('default-account-state')),
                name: 'Default Account State',
                status: 'active',
            };
            break;
        }
        case 'immutableOwner': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('immutable-owner')),
                name: 'Immutable Owner',
                status: 'active',
            };
            break;
        }
        case 'memoTransfer': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('required-memo')),
                name: 'Required Memo',
                status: 'active',
            };
            break;
        }
        case 'nonTransferable': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('non-transferable-token')),
                name: 'Non-Transferable Token',
                status: 'active',
            };
            break;
        }
        case 'nonTransferableAccount': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('non-transferable-token')),
                name: 'Non-Transferable Token Account',
                status: 'active',
            };
            break;
        }
        case 'cpiGuard': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('cpi-guard')),
                name: 'CPI Guard',
                status: 'active',
            };
            break;
        }
        case 'permanentDelegate': {
            const description =
                'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('permanent-delegate')),
                name: 'Permanent Delegate',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'transferHook': {
            const description = 'Allow the token program to execute custom instruction logic on every token transfer';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-hook')),
                name: 'Transfer Hook',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'transferHookAccount': {
            const description = 'List of accounts that the token program requires to execute custom instruction logic';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-hook')),
                name: 'Transfer Hook Account Info',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'metadataPointer': {
            const description = 'Describes the location of the token metadata';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('metadata-pointer')),
                name: 'Metadata Pointer',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'groupPointer': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('group-member')),
                name: 'Group Pointer',
                status: 'active',
            };
            break;
        }
        case 'groupMemberPointer': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('group-member')),
                name: 'Group Member Pointer',
                status: 'active',
            };
            break;
        }
        case 'confidentialTransferAccount': {
            const description = 'Token amount is only able to be unencrypted by the token holder or auditor key';
            return {
                description,
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: 'Confidential Transfer Token Info',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'confidentialTransferFeeConfig': {
            return {
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: 'Confidential Transfer Fee Config',
                status: 'active',
            };
            break;
        }
        case 'confidentialTransferFeeAmount': {
            return {
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: 'Confidential Transfer Fee Amount',
                status: 'active',
            };
            break;
        }
        case 'confidentialTransferMint': {
            const description =
                'Allow token holders to opt-in to encrypted balances that are accessible only to them and the auditor';
            return {
                description,
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: 'Confidential Transfer',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'interestBearingConfig': {
            const description = 'Allows the token balance to be displayed with accumulated interest';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('interest-bearing-token')),
                name: 'Interest Bearing Token Configuration',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'transferFeeConfig': {
            const description =
                'Allows a fee to be set aside on every transfer that can only be withdrawn by the Withdraw Authority';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-fee')),
                name: 'Transfer Fee',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'tokenGroup': {
            return {
                externalLinks: [],
                name: 'Token Group',
                status: 'active',
            };
            break;
        }
        case 'tokenGroupMember': {
            return {
                externalLinks: [],
                name: 'Token Group Member',
                status: 'active',
            };
            break;
        }
        case 'tokenMetadata': {
            const description = 'Allows metadata to be written directly to the mint account';
            return {
                description,
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('metadata-pointer')),
                name: 'Token Metadata',
                status: 'active',
                tooltip: description,
            };
            break;
        }
        case 'unparseableExtension':
        default:
            return {
                externalLinks: [],
                name: 'Unknown Extension',
                status: 'active',
            };
            break;
    }
}
