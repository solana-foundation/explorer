'use client';

import { PublicKey } from '@solana/web3.js';
import { AccountHeader } from '@components/common/Account';
import { useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';

import { StatusType } from '@/app/components/shared/StatusBadge';

import { TokenExtensionsSection } from './TokenExtensionsSection';

export type ExtensionStatus = StatusType;

export interface TokenExtension {
    id: string;
    name: string;
    tooltip?: string;
    description?: string;
    status: ExtensionStatus;
    externalLinks: { label: string; url: string }[];
}

export type ParsedTokenExtensionWithRawData = TokenExtension & {
    parsed?: NonNullable<unknown> | NonNullable<unknown>[];
    raw?: string;
};

export function TokenExtensionsCard({ address }: { address: string }) {
    const refresh = useFetchAccountInfo();
    const mintInfo = useMintAccountInfo(address);
    console.log({ mintInfo: mintInfo?.extensions }, address);

    if (!mintInfo) return null;

    const extensions = populateTokenExtensions(mintInfo.extensions ?? []);

    return (
        <div className="card">
            <AccountHeader title="Extensions" refresh={() => refresh(new PublicKey(address), 'parsed')} />
            <div className="card-body p-0">
                <TokenExtensionsSection extensions={extensions} />
            </div>
        </div>
    );
}

type ParsedExtension = { extension: string; state?: NonNullable<unknown> };

function populateTokenExtensions(extensions: ParsedExtension[]): ParsedTokenExtensionWithRawData[] {
    function populateExternalLinks(url: string) {
        return [{ label: 'Docs', url }];
    }

    function findExtensionByKeyword(keyword: string, extensions: ParsedExtension[]) {
        return extensions.find(ext => ext.extension === keyword);
    }

    /**
     * Sample.
     * TODO: To be removed upon editing all the details for each extension

        id: 'permanent-delegate',
        name: 'Permanent Delegate',
        tooltip: 'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
        description: 'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
        status: 'active',
        externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/permanent-delegate'),
     */
    const result = extensions.reduce((acc, { extension, state }) => {
        switch (extension) {
            case 'mintCloseAuthority': {
                acc.set(extension, {
                    id: extension,
                    name: 'Mint Close Authority',
                    tooltip: undefined,
                    description: undefined,
                    status: 'active',
                    externalLinks: populateExternalLinks(
                        'https://solana.com/developers/guides/token-extensions/mint-close-authority'
                    ),
                    parsed: state,
                    raw: state,
                });
                break;
            }
            case 'permanentDelegate': {
                acc.set(extension, {
                    id: extension,
                    name: 'Permanent Delegate',
                    tooltip:
                        'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
                    description:
                        'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
                    status: 'active',
                    externalLinks: populateExternalLinks(
                        'https://solana.com/developers/guides/token-extensions/permanent-delegate'
                    ),
                    parsed: state,
                    raw: state,
                });
                break;
            }
            case 'transferFeeConfig': {
                acc.set(extension, {
                    id: extension,
                    name: 'Transfer Fee',
                    tooltip: undefined,
                    description: undefined,
                    status: 'active',
                    externalLinks: populateExternalLinks(
                        'https://solana.com/developers/guides/token-extensions/transfer-fee'
                    ),
                    parsed: state,
                    raw: state,
                });
                break;
            }
            case 'transferHook': {
                acc.set(extension, {
                    id: extension,
                    name: 'Transfer Hook',
                    tooltip: undefined,
                    description: undefined,
                    status: 'active',
                    externalLinks: populateExternalLinks(
                        'https://solana.com/developers/guides/token-extensions/transfer-hook'
                    ),
                    parsed: state,
                    raw: state,
                });
                break;
            }
            case 'confidentialTransferMint':
            case 'confidentialTransferFeeConfig': {
                const EXTENSION_NAME = 'confidentialTransfer';

                // find confidentialTransfer parts by searching for the index. The are not much extensions so it won't be a bottleneck

                if (!acc.has(EXTENSION_NAME)) {
                    const data = [
                        ['Mint', findExtensionByKeyword('confidentialTransferMint', extensions)?.state ?? {}],
                        [
                            'Fee Config',
                            findExtensionByKeyword('confidentialTransferFeeConfig', extensions)?.state ?? {},
                        ],
                    ];
                    acc.set(EXTENSION_NAME, {
                        id: EXTENSION_NAME,
                        name: 'Confidential Transfer',
                        tooltip: undefined,
                        description: undefined,
                        status: 'active',
                        externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                        parsed: data,
                        raw: data,
                    });
                }
                break;
            }
            case 'metadataPointer':
            case 'tokenMetadata': {
                const EXTENSION_NAME = 'metadataPointer';

                // find confidentialTransfer parts by searching for the index. The are not much extensions so it won't be a bottleneck

                if (!acc.has(EXTENSION_NAME)) {
                    const data = [
                        ['Metadata Pointer', findExtensionByKeyword('metadataPointer', extensions)?.state ?? {}],
                        ['Token Metadata', findExtensionByKeyword('tokenMetadata', extensions)?.state ?? {}],
                    ];

                    acc.set(EXTENSION_NAME, {
                        id: EXTENSION_NAME,
                        name: 'Metadata & Metadata Pointer',
                        tooltip: undefined,
                        description: undefined,
                        status: 'active',
                        externalLinks: populateExternalLinks(
                            'https://solana.com/developers/guides/token-extensions/metadata-pointer'
                        ),
                        parsed: data,
                        raw: data,
                    });
                }
                break;
            }
            default:
                break;
        }
        return acc;
    }, new Map<string, ParsedTokenExtensionWithRawData>());

    return Array.from(result.values());
}
