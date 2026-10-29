import {
    address,
    argType,
    DecodedInstructionCard,
    type FieldValue,
    type InstructionArg,
    InstructionCardView,
    InstructionFields,
    type InstructionNode,
    type RawInstructionNode,
} from '@entities/instruction-card';
import { useFetchAccountInfo, useMintAccountInfo, useTokenAccountInfo } from '@providers/accounts';
import { type AccountMeta, PublicKey } from '@solana/web3.js';
import { capitalizeFirstLetter, normalizeTokenAmount } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create, is, Struct } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { Cluster } from '@/app/utils/cluster';
import { TOKEN_IDS } from '@/app/utils/programs';
import { getTokenInfo, getTokenInfoSwrKey } from '@/app/utils/token-info';

import { IX_STRUCTS, IX_TITLES, TokenAmountUi, TokenInstructionType } from './types';

type TokenInfo = object;

type TokenDetailsCardProps = {
    node: InstructionNode;
    parsed: unknown;
};

export function TokenDetailsCard({ node, parsed }: TokenDetailsCardProps) {
    const { type: rawType, info } = create(parsed, ParsedInfo);
    const type = create(rawType, TokenInstructionType);
    const title = `${TOKEN_IDS[node.programId.toString()]}: ${IX_TITLES[type]}`;
    const struct = IX_STRUCTS[type] as Struct<TokenInfo>;

    return <TokenInstructionCard node={node} title={title} info={create(info, struct)} />;
}

function TokenInstructionCard({ node, title, info }: { node: InstructionNode; title: string; info: TokenInfo }) {
    const { mintAddress: infoMintAddress, tokenAddress } = amountAccount(info);
    const tokenInfo = useTokenAccountInfo(tokenAddress);

    const mintAddress = infoMintAddress || tokenInfo?.mint.toBase58();
    const mintInfo = useMintAccountInfo(mintAddress);
    const fetchAccountInfo = useFetchAccountInfo();

    React.useEffect(() => {
        if (tokenAddress && !tokenInfo) {
            fetchAccountInfo(new PublicKey(tokenAddress), 'parsed');
        }
    }, [fetchAccountInfo, tokenAddress]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        if (mintAddress && !mintInfo) {
            fetchAccountInfo(new PublicKey(mintAddress), 'parsed');
        }
    }, [fetchAccountInfo, mintAddress]); // eslint-disable-line react-hooks/exhaustive-deps

    const { cluster, url } = useCluster();
    const { data: tokenDetails } = useSWR(
        mintAddress ? getTokenInfoSwrKey(mintAddress, cluster, url) : null,
        fetchTokenInfo,
    );
    const decimals =
        'tokenAmount' in info && is(info.tokenAmount, TokenAmountUi) ? info.tokenAmount.decimals : mintInfo?.decimals;
    const tokenSymbol = mintAddress && tokenDetails ? tokenDetails.symbol : '';
    const rows = infoRows(info, { decimals, tokenSymbol });
    const token = mintAddress !== undefined && address('Token', new PublicKey(mintAddress), { tokenLabel: true });

    // The RPC lists no accounts of an instruction it parses, so only a raw instruction has account rows.
    if (hasRaw(node)) {
        const split = splitAccounts(node.raw.keys, rows);
        if (split) {
            return (
                <DecodedInstructionCard
                    node={node}
                    title={title}
                    accountNames={split.accountNames}
                    args={split.args}
                    fields={[token]}
                />
            );
        }
    }
    return (
        <InstructionCardView node={node} title={title}>
            <InstructionFields
                programId={node.programId}
                fields={[token, ...rows.map(({ name, value }) => ({ ...value, label: name }))]}
            />
        </InstructionCardView>
    );
}

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await getTokenInfo(new PublicKey(address), cluster, url);
}

/** An instruction without `amount` needs no mint, so it looks up no account. */
function amountAccount(info: TokenInfo): { mintAddress?: string; tokenAddress?: string } {
    if (!('amount' in info)) return {};
    if ('mint' in info && info.mint instanceof PublicKey) return { mintAddress: info.mint.toBase58() };
    if ('account' in info && info.account instanceof PublicKey) return { tokenAddress: info.account.toBase58() };
    if ('source' in info && info.source instanceof PublicKey) return { tokenAddress: info.source.toBase58() };
    return {};
}

function hasRaw(node: InstructionNode): node is RawInstructionNode {
    return node.raw !== undefined;
}

/**
 * Names each account of the raw instruction after the row that holds its address. The other rows are arguments.
 * Returns `undefined` when two rows hold one address, because the rows do not follow the account order.
 */
function splitAccounts(
    keys: readonly AccountMeta[],
    rows: readonly InfoRow[],
): { accountNames: string[]; args: InfoRow[] } | undefined {
    const addresses = rows.flatMap(({ value }) => (value.kind === 'address' ? [value.address] : []));
    if (new Set(addresses).size < addresses.length) return undefined;

    const args = [...rows];
    const accountNames = keys.map(({ pubkey }) => {
        const index = args.findIndex(({ value }) => value.kind === 'address' && value.address === pubkey.toBase58());
        return index === -1 ? '' : args.splice(index, 1)[0].name;
    });
    return { accountNames, args };
}

type InfoRow = Extract<InstructionArg, { kind: 'leaf' }>;

type AmountFormat = { decimals: number | undefined; tokenSymbol: string };

function infoRows(info: TokenInfo, format: AmountFormat): InfoRow[] {
    return Object.entries(info).flatMap(([key, value]): InfoRow[] => {
        const name = capitalizeFirstLetter(key);
        if (value === undefined) return [];
        if (value === null) return [infoRow(name, value, { kind: 'text', value: '(none)' })];
        if (isPublicKeyList(value)) return value.map((pubkey, i) => addressRow(`${name} - #${i + 1}`, pubkey));
        if (key === 'tokenAmount' && is(value, TokenAmountUi)) return [amountRow(value.amount, format)];
        if (value instanceof PublicKey) return [addressRow(name, value)];
        if (key === 'amount' && isNumeric(value)) return [amountRow(value, format)];
        if (isNumeric(value)) return [infoRow(name, value, { kind: 'text', value })];
        if (typeof value === 'boolean') return [infoRow(name, value, { kind: 'text', value: String(value) })];
        if (Array.isArray(value) && value.every(isNumeric)) {
            return [infoRow(name, value, { kind: 'preformatted', value })];
        }
        throw new Error(`Token instruction field ${key} of type ${typeof value} has no row format`);
    });
}

function infoRow(name: string, parsed: unknown, value: FieldValue): InfoRow {
    return { kind: 'leaf', name, type: argType(parsed), value };
}

function addressRow(name: string, pubkey: PublicKey): InfoRow {
    const address = toKitAddress(pubkey);
    return infoRow(name, address, { address, kind: 'address' });
}

function amountRow(value: string | number, { decimals, tokenSymbol }: AmountFormat): InfoRow {
    const raw = value as number | Intl.StringNumericLiteral;
    const amount =
        decimals === undefined
            ? new Intl.NumberFormat('en-US').format(raw)
            : new Intl.NumberFormat('en-US', {
                  maximumFractionDigits: decimals,
                  minimumFractionDigits: decimals,
              }).format(normalizeTokenAmount(value, decimals));

    return infoRow(decimals === undefined ? 'Amount (raw)' : 'Amount', value, {
        kind: 'text',
        value: tokenSymbol ? `${amount} ${tokenSymbol}` : amount,
    });
}

function isPublicKeyList(value: unknown): value is PublicKey[] {
    return Array.isArray(value) && value.every(item => item instanceof PublicKey);
}

function isNumeric(value: unknown): value is string | number {
    return typeof value === 'string' || typeof value === 'number';
}
