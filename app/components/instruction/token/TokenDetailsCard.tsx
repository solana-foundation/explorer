import {
    address,
    InstructionCardView,
    type InstructionField,
    InstructionFields,
    type InstructionNode,
    preformatted,
    text,
} from '@entities/instruction-card';
import { useFetchAccountInfo, useMintAccountInfo, useTokenAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { normalizeTokenAmount } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create, is, Struct } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
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

    return (
        <InstructionCardView node={node} title={title}>
            <InstructionFields
                programId={node.programId}
                fields={[
                    mintAddress !== undefined && address('Token', new PublicKey(mintAddress), { tokenLabel: true }),
                    ...infoFields(info, { decimals, tokenSymbol }),
                ]}
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

type AmountFormat = { decimals: number | undefined; tokenSymbol: string };

function infoFields(info: TokenInfo, format: AmountFormat): InstructionField[] {
    return Object.entries(info).flatMap(([key, value]): InstructionField[] => {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        if (value === undefined) return [];
        if (value === null) return [text(label, '(none)')];
        if (isPublicKeyList(value)) return value.map((pubkey, i) => address(`${label} - #${i + 1}`, pubkey));
        if (key === 'tokenAmount' && is(value, TokenAmountUi)) return [amountField(value.amount, format)];
        if (value instanceof PublicKey) return [address(label, value)];
        if (key === 'amount' && isNumeric(value)) return [amountField(value, format)];
        if (isNumeric(value)) return [text(label, value)];
        if (typeof value === 'boolean') return [text(label, String(value))];
        if (Array.isArray(value) && value.every(isNumeric)) return [preformatted(label, value)];
        throw new Error(`Token instruction field ${key} of type ${typeof value} has no row format`);
    });
}

function amountField(value: string | number, { decimals, tokenSymbol }: AmountFormat): InstructionField {
    const raw = value as number | Intl.StringNumericLiteral;
    const amount =
        decimals === undefined
            ? new Intl.NumberFormat('en-US').format(raw)
            : new Intl.NumberFormat('en-US', {
                  maximumFractionDigits: decimals,
                  minimumFractionDigits: decimals,
              }).format(normalizeTokenAmount(value, decimals));

    return text(decimals === undefined ? 'Amount (raw)' : 'Amount', tokenSymbol ? `${amount} ${tokenSymbol}` : amount);
}

function isPublicKeyList(value: unknown): value is PublicKey[] {
    return Array.isArray(value) && value.every(item => item instanceof PublicKey);
}

function isNumeric(value: unknown): value is string | number {
    return typeof value === 'string' || typeof value === 'number';
}
