'use client';

import { TruncatedValue, type TruncatedValueProps } from '@components/shared/TruncatedValue';
import { TransactionSignature } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';

const SIGNATURE_MID_TRUNCATE_CHARS = 5;

type Props = {
    signature: TransactionSignature;
    link?: boolean;
    noTruncate?: boolean;
} & Pick<TruncatedValueProps, 'alignItems' | 'alignRight' | 'className'>;

export function Signature({ signature, link, noTruncate, ...rest }: Props) {
    const transactionPath = useClusterPath({ pathname: `/tx/${signature}` });

    return (
        <TruncatedValue
            value={signature}
            href={link ? transactionPath : undefined}
            truncation={{ enabled: !noTruncate, midTruncateChars: SIGNATURE_MID_TRUNCATE_CHARS }}
            {...rest}
        />
    );
}
