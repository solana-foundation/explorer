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
    parsed?: NonNullable<unknown>;
    raw?: string;
}

export function TokenExtensionsCard({ address }: { address: string }) {
    const refresh = useFetchAccountInfo();
    const mintInfo = useMintAccountInfo(address);
    console.log({ mintInfo: mintInfo?.extensions }, address)

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

type ParsedExtension = { extension: string, state?: NonNullable<unknown> }

function populateTokenExtensions(extensions: ParsedExtension[]): ParsedTokenExtensionWithRawData[] {
    function populateExternalLinks(url: string) {
        return [{ label: 'Docs', url }]
    }

    function populateRawData(state?: NonNullable<unknown>) {
        return state ? JSON.stringify(state, null, 2) : undefined
    }

    function findExtensionByKeyword(keyword: string, extensions: ParsedExtension[]) {
        return extensions.find(ext => ext.extension === keyword);
    }

    function populateConfidentialTransfer(mint: NonNullable<unknown>, feeConfig: NonNullable<unknown>){
        return {
            id: 'confidential-transfers',
            name: 'Confidential Transfer',
            tooltip: undefined,
            description: undefined,
            status: 'active',
            externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
            raw: populateRawData({
                confidentialTransferMint: mint,
                confidentialTransferFeeConfig: feeConfig,
            }),
        }
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
        parsed: state,
        raw: populateRawData(state),
     */
    const result = extensions.reduce((acc, { extension, state }) => {
        switch(extension){
            case 'mintCloseAuthority': {
                acc.set(extension, {
                    id: extension,
                    name: 'Mint Close Authority',
                    tooltip: undefined,
                    description: undefined,
                    status: 'active',
                    externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/mint-close-authority'),
                    parsed: state,
                    raw: populateRawData(state),
                });
                break;
            }
            case 'permanentDelegate': {
                acc.set(extension, {
                    id: extension,
                    name: 'Permanent Delegate',
                    tooltip: 'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
                    description: 'Delegates permanent authority to a specific address that can transfer or burn tokens from any account holding this token, providing centralized administrative control over the token ecosystem.',
                    status: 'active',
                    externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/permanent-delegate'),
                    parsed: state,
                    raw: populateRawData(state),
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
                    externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/transfer-fee'),
                    parsed: state,
                    raw: populateRawData(state),
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
                    externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/transfer-hook'),
                    parsed: state,
                    raw: populateRawData(state),
                });
                break;
            }
            case 'confidentialTransferMint':
            case 'confidentialTransferFeeConfig': {
                const EXTENSION_NAME = 'confidentialTransfer'

                // find confidentialTransfer parts by searching for the index. The are not much extensions so it won't be a bottleneck

                if (!acc.has(EXTENSION_NAME)) {
                    const data = {
                            confidentialTransferMint:findExtensionByKeyword('confidentialTransferMint', extensions)?.state ?? {},
                            confidentialTransferFeeConfig:findExtensionByKeyword('confidentialTransferFeeConfig', extensions)?.state ?? {},
                    }
                    acc.set(EXTENSION_NAME, {
                        id: EXTENSION_NAME,
                        name: 'Confidential Transfer',
                        tooltip: undefined,
                        description: undefined,
                        status: 'active',
                        externalLinks: populateExternalLinks('https://spl.solana.com/confidential-token/quickstart'),
                        parsed: data,
                        raw: populateRawData(data),
                    });
                }
                break;
            }
            case 'metadataPointer':
            case 'tokenMetadata': {
                const EXTENSION_NAME = 'metadataPointer'

                // find confidentialTransfer parts by searching for the index. The are not much extensions so it won't be a bottleneck

                if (!acc.has(EXTENSION_NAME)) {
                    const data = {
                        metadataPointer:findExtensionByKeyword('metadataPointer', extensions)?.state ?? {},
                        tokenMetadata: findExtensionByKeyword('tokenMetadata', extensions)?.state ?? {},
                    }
                    acc.set(EXTENSION_NAME, {
                        id: EXTENSION_NAME,
                        name: 'Metadata & Metadata Pointer',
                        tooltip: undefined,
                        description: undefined,
                        status: 'active',
                        externalLinks: populateExternalLinks('https://solana.com/developers/guides/token-extensions/metadata-pointer'),
                        parsed: data,
                        raw: populateRawData(data),
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