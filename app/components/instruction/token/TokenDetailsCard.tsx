import { Address } from '@components/common/Address';
import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { useFetchAccountInfo, useMintAccountInfo, useTokenAccountInfo } from '@providers/accounts';
import {
    ParsedInstruction,
    ParsedTransaction,
    PublicKey,
    SignatureResult,
    TransactionInstruction,
} from '@solana/web3.js';
import { normalizeTokenAmount } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';
import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { CProp, CType } from '@/app/types/generics';
import { Cluster } from '@/app/utils/cluster';
import { TOKEN_IDS } from '@/app/utils/programs';
import { getTokenInfo, getTokenInfoSwrKey } from '@/app/utils/token-info';

import { InstructionCard } from '../InstructionCard';
import { IX_STRUCTS, IX_TITLES, TokenAmountUi, TokenInstructionType } from './types';

//type DetailsProps<D> = Pick<
//InfoProps<D>,
//'ix' | 'result' | 'index' | 'innerCards' | 'childIndex' | 'InstructionCardComponent'
//> & {
//tx: ParsedTransaction;
//};

type TokenDetailsCardProps<D extends CType> = {
    InstructionCardComponent?: D;
    tx: ParsedTransaction;
} & Omit<CProp<D>, 'title'> &
    Omit<InfoProps<D>, 'info' | 'title'>;

export function TokenDetailsCard<D extends CType>(
    //props: Pick<InfoProps<D>, 'childIndex' | 'index' | 'innerCards' | 'ix' | 'InstructionCardComponent' | 'result'> & {
    //tx: ParsedTransaction;
    //}
    props: TokenDetailsCardProps<D>
) {
    const parsed = create(props.ix.parsed, ParsedInfo);
    const { type: rawType, info } = parsed;
    console.log({ rawType }, props);
    const type = create(rawType, TokenInstructionType);
    console.log(888, { type }, info);
    console.log(99, -1, props);
    const title = `${TOKEN_IDS[props.ix.programId.toString()]}: ${IX_TITLES[type]}`;
    const created = create(info, IX_STRUCTS[type] as any);
    return <TokenInstruction<D> title={title} info={created} {...props} />;
}

type InfoProps<D extends CType> = {
    //childIndex?: number;
    //index: number;
    info: any;
    //innerCards?: JSX.Element[];
    InstructionCardComponent?: D;
    ix: TransactionInstruction | ParsedInstruction;
    //result: SignatureResult;
} & CProp<D>;

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await getTokenInfo(new PublicKey(address), cluster, url);
}

function TokenInstruction<D extends CType>({ InstructionCardComponent = InstructionCard, ...props }: InfoProps<D>) {
    const { mintAddress: infoMintAddress, tokenAddress } = React.useMemo(() => {
        let mintAddress: string | undefined;
        let tokenAddress: string | undefined;

        // No sense fetching accounts if we don't need to convert an amount
        if (!('amount' in props.info)) return {};

        if ('mint' in props.info && props.info.mint instanceof PublicKey) {
            mintAddress = props.info.mint.toBase58();
        } else if ('account' in props.info && props.info.account instanceof PublicKey) {
            tokenAddress = props.info.account.toBase58();
        } else if ('source' in props.info && props.info.source instanceof PublicKey) {
            tokenAddress = props.info.source.toBase58();
        }
        return {
            mintAddress,
            tokenAddress,
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const tokenInfo = useTokenAccountInfo(tokenAddress, props.c === 1);
    console.log(77777, infoMintAddress, '|', tokenAddress, tokenInfo?.mint.toBase58(), tokenInfo);
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
        fetchTokenInfo
    );
    console.log(7777, tokenDetails, mintAddress);
    const attributes: JSX.Element[] = [];
    let decimals = mintInfo?.decimals;
    let tokenSymbol = '';

    if ('tokenAmount' in props.info) {
        decimals = props.info.tokenAmount.decimals;
    }

    if (props.c == 1) {
        console.log(666, { tokenAddress, tokenInfo }, mintAddress);
    }
    if (mintAddress) {
        if (tokenDetails) {
            tokenSymbol = tokenDetails.symbol;
        }

        attributes.push(
            <tr key={mintAddress}>
                <td>Token</td>
                <td className="text-lg-end">
                    <Address pubkey={new PublicKey(mintAddress)} alignRight link fetchTokenLabelInfo />
                </td>
            </tr>
        );
    }

    for (let key in props.info) {
        let value = props.info[key];
        if (value === undefined) continue;

        // Flatten lists of public keys
        if (Array.isArray(value) && value.every(v => v instanceof PublicKey)) {
            for (let i = 0; i < value.length; i++) {
                const publicKey = value[i];
                const label = `${key.charAt(0).toUpperCase() + key.slice(1)} - #${i + 1}`;

                attributes.push(
                    <tr key={key + i}>
                        <td>{label}</td>
                        <td className="text-lg-end">
                            <Address pubkey={publicKey} alignRight link />
                        </td>
                    </tr>
                );
            }
            continue;
        }

        if (key === 'tokenAmount') {
            key = 'amount';
            value = (value as TokenAmountUi).amount;
        }

        let tag;
        let labelSuffix = '';
        if (value instanceof PublicKey) {
            tag = <Address pubkey={value} alignRight link />;
        } else if (key === 'amount') {
            let amount;
            if (decimals === undefined) {
                labelSuffix = ' (raw)';
                amount = new Intl.NumberFormat('en-US').format(value);
            } else {
                amount = new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: decimals,
                    minimumFractionDigits: decimals,
                }).format(normalizeTokenAmount(value, decimals));
            }
            tag = (
                <>
                    {amount} {tokenSymbol}
                </>
            );
        } else {
            tag = <>{value}</>;
        }

        const label = key.charAt(0).toUpperCase() + key.slice(1) + labelSuffix;

        attributes.push(
            <tr key={key}>
                <td>{label}</td>
                <td className="text-lg-end">{tag}</td>
            </tr>
        );
    }

    return (
        <InstructionCardComponent
            ix={props.ix}
            index={props.index}
            result={props.result}
            title={props.title}
            innerCards={props.innerCards}
            childIndex={props.childIndex}
            raw={props.raw}
            message={props.message}
        >
            {attributes}
        </InstructionCardComponent>
    );
}
