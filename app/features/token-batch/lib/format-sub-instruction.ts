// Converts SDK-parsed token instructions into labeled, human-readable output
// for display in the UI.

import { formatTokenAmount } from '@entities/token-amount';
import { type AccountMeta, isSignerRole, isSome, isWritableRole } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { AuthorityType, type ParsedTokenInstruction, TokenInstruction } from '@solana-program/token';
import { capitalCase } from 'change-case';

import type { DecodedField, DecodedParams, LabeledAccount, MintInfo } from './types';

// These instructions don't include the mint in their on-chain account list.
// When the mint address has been resolved via RPC, we inject a synthetic
// "Mint" account after the first account (index 0).
const MINT_INJECT_TYPES = new Set<TokenInstruction>([
    TokenInstruction.Transfer,
    TokenInstruction.Approve,
    TokenInstruction.CloseAccount,
    TokenInstruction.Revoke,
]);

export function formatParsedInstruction(
    parsed: ParsedTokenInstruction<string>,
    mintInfo?: MintInfo,
    extraSigners?: LabeledAccount[],
): DecodedParams | undefined {
    try {
        const result = formatByType(parsed, mintInfo?.decimals);
        if (!result) return undefined;

        const { fields, accounts } = result;

        if (mintInfo?.mint && MINT_INJECT_TYPES.has(parsed.instructionType)) {
            accounts.splice(1, 0, {
                isSigner: false,
                isWritable: false,
                label: 'Mint*',
                pubkey: new PublicKey(mintInfo.mint),
            });
        }

        if (extraSigners?.length) {
            accounts.push(...extraSigners);
        }

        return { accounts, fields };
    } catch {
        return undefined;
    }
}

function formatByType(
    parsed: ParsedTokenInstruction<string>,
    externalDecimals?: number,
): { fields: DecodedField[]; accounts: LabeledAccount[] } | undefined {
    switch (parsed.instructionType) {
        case TokenInstruction.Transfer:
            return {
                accounts: labelMetas([
                    { label: 'Source', meta: parsed.accounts.source },
                    { label: 'Destination', meta: parsed.accounts.destination },
                    { label: 'Owner/Delegate', meta: parsed.accounts.authority },
                ]),
                fields: [
                    {
                        label: 'Amount',
                        value:
                            externalDecimals === undefined
                                ? parsed.data.amount.toString()
                                : formatTokenAmount({ amount: parsed.data.amount, decimals: externalDecimals }),
                    },
                ],
            };

        case TokenInstruction.Approve:
            return {
                accounts: labelMetas([
                    { label: 'Source', meta: parsed.accounts.source },
                    { label: 'Delegate', meta: parsed.accounts.delegate },
                    { label: 'Owner', meta: parsed.accounts.owner },
                ]),
                fields: [
                    {
                        label: 'Amount',
                        value:
                            externalDecimals === undefined
                                ? parsed.data.amount.toString()
                                : formatTokenAmount({ amount: parsed.data.amount, decimals: externalDecimals }),
                    },
                ],
            };

        case TokenInstruction.MintTo:
            return {
                accounts: labelMetas([
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Destination', meta: parsed.accounts.token },
                    { label: 'Mint Authority', meta: parsed.accounts.mintAuthority },
                ]),
                fields: [
                    {
                        label: 'Amount',
                        value:
                            externalDecimals === undefined
                                ? parsed.data.amount.toString()
                                : formatTokenAmount({ amount: parsed.data.amount, decimals: externalDecimals }),
                    },
                ],
            };

        case TokenInstruction.Burn:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.account },
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Owner/Delegate', meta: parsed.accounts.authority },
                ]),
                fields: [
                    {
                        label: 'Amount',
                        value:
                            externalDecimals === undefined
                                ? parsed.data.amount.toString()
                                : formatTokenAmount({ amount: parsed.data.amount, decimals: externalDecimals }),
                    },
                ],
            };

        case TokenInstruction.TransferChecked:
            return {
                accounts: labelMetas([
                    { label: 'Source', meta: parsed.accounts.source },
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Destination', meta: parsed.accounts.destination },
                    { label: 'Owner/Delegate', meta: parsed.accounts.authority },
                ]),
                fields: [
                    { label: 'Decimals', value: parsed.data.decimals.toString() },
                    {
                        label: 'Amount',
                        value: formatTokenAmount({ amount: parsed.data.amount, decimals: parsed.data.decimals }),
                    },
                ],
            };

        case TokenInstruction.ApproveChecked:
            return {
                accounts: labelMetas([
                    { label: 'Source', meta: parsed.accounts.source },
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Delegate', meta: parsed.accounts.delegate },
                    { label: 'Owner', meta: parsed.accounts.owner },
                ]),
                fields: [
                    { label: 'Decimals', value: parsed.data.decimals.toString() },
                    {
                        label: 'Amount',
                        value: formatTokenAmount({ amount: parsed.data.amount, decimals: parsed.data.decimals }),
                    },
                ],
            };

        case TokenInstruction.MintToChecked:
            return {
                accounts: labelMetas([
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Destination', meta: parsed.accounts.token },
                    { label: 'Mint Authority', meta: parsed.accounts.mintAuthority },
                ]),
                fields: [
                    { label: 'Decimals', value: parsed.data.decimals.toString() },
                    {
                        label: 'Amount',
                        value: formatTokenAmount({ amount: parsed.data.amount, decimals: parsed.data.decimals }),
                    },
                ],
            };

        case TokenInstruction.BurnChecked:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.account },
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Owner/Delegate', meta: parsed.accounts.authority },
                ]),
                fields: [
                    { label: 'Decimals', value: parsed.data.decimals.toString() },
                    {
                        label: 'Amount',
                        value: formatTokenAmount({ amount: parsed.data.amount, decimals: parsed.data.decimals }),
                    },
                ],
            };

        case TokenInstruction.CloseAccount:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.account },
                    { label: 'Destination', meta: parsed.accounts.destination },
                    { label: 'Owner', meta: parsed.accounts.owner },
                ]),
                fields: [],
            };

        case TokenInstruction.FreezeAccount:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.account },
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Freeze Authority', meta: parsed.accounts.owner },
                ]),
                fields: [],
            };

        case TokenInstruction.ThawAccount:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.account },
                    { label: 'Mint', meta: parsed.accounts.mint },
                    { label: 'Freeze Authority', meta: parsed.accounts.owner },
                ]),
                fields: [],
            };

        case TokenInstruction.Revoke:
            return {
                accounts: labelMetas([
                    { label: 'Source', meta: parsed.accounts.source },
                    { label: 'Owner', meta: parsed.accounts.owner },
                ]),
                fields: [],
            };

        case TokenInstruction.SetAuthority:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.owned },
                    { label: 'Current Authority', meta: parsed.accounts.owner },
                ]),
                fields: [
                    {
                        label: 'Authority Type',
                        value: AuthorityType[parsed.data.authorityType] ?? `Unknown (${parsed.data.authorityType})`,
                    },
                    ...(isSome(parsed.data.newAuthority)
                        ? [{ isAddress: true, label: 'New Authority', value: parsed.data.newAuthority.value }]
                        : [{ label: 'New Authority', value: '(none)' }]),
                ],
            };

        case TokenInstruction.InitializeMint2:
            return {
                accounts: labelMetas([{ label: 'Mint', meta: parsed.accounts.mint }]),
                fields: [
                    { label: 'Decimals', value: parsed.data.decimals.toString() },
                    { isAddress: true, label: 'Mint Authority', value: parsed.data.mintAuthority },
                    ...(isSome(parsed.data.freezeAuthority)
                        ? [{ isAddress: true, label: 'Freeze Authority', value: parsed.data.freezeAuthority.value }]
                        : [{ label: 'Freeze Authority', value: '(none)' }]),
                ],
            };

        case TokenInstruction.InitializeAccount3:
            return {
                accounts: labelMetas([
                    { label: 'Account', meta: parsed.accounts.account },
                    { label: 'Mint', meta: parsed.accounts.mint },
                ]),
                fields: [{ isAddress: true, label: 'Owner', value: parsed.data.owner }],
            };

        default:
            return genericFallback(parsed);
    }
}

// For instruction types without dedicated formatting, extract accounts
// generically so users can still see the addresses involved.
function genericFallback(parsed: ParsedTokenInstruction<string>): {
    fields: DecodedField[];
    accounts: LabeledAccount[];
} {
    const accounts: LabeledAccount[] = [];

    if ('accounts' in parsed && parsed.accounts && typeof parsed.accounts === 'object') {
        for (const [key, meta] of Object.entries(parsed.accounts)) {
            // Some parsed variants have optional accounts (e.g. SyncNative.rent)
            // that are undefined when not present on-chain.
            if (!meta) continue;

            // Object.entries erases the value type to unknown; every
            // ParsedTokenInstruction variant stores AccountMeta here.
            const typedMeta = meta as AccountMeta<string>;
            accounts.push({
                isSigner: isSignerRole(typedMeta.role),
                isWritable: isWritableRole(typedMeta.role),
                label: capitalCase(key),
                pubkey: new PublicKey(typedMeta.address),
            });
        }
    }

    return { accounts, fields: [] };
}

function labelMetas(entries: { label: string; meta: AccountMeta<string> }[]): LabeledAccount[] {
    return entries.map(({ label, meta }) => ({
        isSigner: isSignerRole(meta.role),
        isWritable: isWritableRole(meta.role),
        label,
        pubkey: new PublicKey(meta.address),
    }));
}
