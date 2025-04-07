'use client';

import { AccountHeader } from '@components/common/Account';
import { useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';

import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionType } from './TokenAccountSection';
import { TokenExtensionsSection } from './TokenExtensionsSection';
import { ParsedTokenExtension } from './types';

export function TokenExtensionsCard({ address }: { address: string }) {
    const refresh = useFetchAccountInfo();
    const mintInfo = useMintAccountInfo(address);

    if (!mintInfo || !mintInfo.extensions) return null;

    const extensions = populateTokenExtensions(mintInfo.extensions);

    return (
        <div className="card">
            <AccountHeader title="Extensions" refresh={() => refresh(new PublicKey(address), 'parsed')} />
            <div className="card-body p-0">
                <TokenExtensionsSection
                    decimals={mintInfo.decimals}
                    extensions={mintInfo.extensions}
                    parsedExtensions={extensions}
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

    /**
     * Sample.
     * TODO: To be removed upon editing all the details for each extension
        description: 'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
        externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/permanent-delegate'),
        name: 'Permanent Delegate',
        status: 'active',
        tooltip: 'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
     */
    switch (extension) {
        case 'transferFeeAmount': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-fee')),
                name: 'Transfer Fee Amount',
                status: 'active',
            };
            break;
        }
        case 'mintCloseAuthority': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('mint-close-authority')),
                name: 'Mint Close Authority',
                status: 'active',
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
                name: "Non-Transferable Token's Account",
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
            return {
                description:
                    'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('permanent-delegate')),
                name: 'Permanent Delegate',
                status: 'active',
                tooltip:
                    'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
            };
            break;
        }
        case 'transferHook': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-hook')),
                name: 'Transfer Hook',
                status: 'active',
            };
            break;
        }
        case 'transferHookAccount': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-hook')),
                name: "Transfer Hook's Account",
                status: 'active',
            };
            break;
        }
        case 'metadataPointer': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('token-extensions-metadata')),
                name: 'Metadata Pointer',
                status: 'active',
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
            return {
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: "Confidential Transfer's Account",
                status: 'active',
            };
            break;
        }
        case 'confidentialTransferFeeConfig': {
            return {
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: "Confidential Transfer's Fee Config",
                status: 'active',
            };
            break;
        }
        case 'confidentialTransferFeeAmount': {
            return {
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: "Confidential Transfer's Fee Amount",
                status: 'active',
            };
            break;
        }
        case 'confidentialTransferMint': {
            return {
                externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                name: "Confidential Transfer's Mint",
                status: 'active',
            };
            break;
        }
        case 'interestBearingConfig': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('interest-bearing-token')),
                name: 'Interest Bearing Token Configuration',
                status: 'active',
            };
            break;
        }
        case 'transferFeeConfig': {
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('transfer-fee')),
                name: 'Transfer Fee',
                status: 'active',
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
            return {
                externalLinks: populateExternalLinks(populateSolanaDevelopersLink('token-extensions-metadata')),
                name: 'Token Metadata',
                status: 'active',
            };
            break;
        }
        case 'unparseableExtension':
        default:
            return {
                description: undefined,
                externalLinks: [],
                name: 'Unparseable Extension',
                status: 'active',
                tooltip: undefined,
            };
            break;
    }
}
