import { Keypair } from '@solana/web3.js';

import { Cluster } from '@/app/utils/cluster';

import { formatReceiptData } from '../../model/create-receipt';
import type { Receipt } from '../../model/types';
import type { FormattedExtendedReceipt, FormattedReceipt } from '../../types';

const CLUSTER = Cluster.MainnetBeta;

const senderKeypair = Keypair.generate();
const receiverKeypair = Keypair.generate();

const raw = {
    date: 1737100062,
    receiver: receiverKeypair.publicKey.toBase58(),
    sender: senderKeypair.publicKey.toBase58(),
};

const baseSolReceipt: Receipt = {
    date: raw.date,
    fee: 5000,
    receiver: raw.receiver,
    sender: raw.sender,
    total: 143250000000,
    type: 'sol',
};

export const longMemoText =
    'This is a very long description that demonstrates how the receipt component handles extended text content. It includes multiple sentences and various details about the transaction, such as the purpose of the payment, the services rendered, and any additional context that might be relevant to understanding the nature of this particular blockchain transaction on the Solana network.';

export const defaultReceipt: FormattedReceipt = formatReceiptData(baseSolReceipt, CLUSTER);

export const receiptWithMemo: FormattedReceipt = formatReceiptData(
    { ...baseSolReceipt, memo: longMemoText, total: 50000000000 },
    CLUSTER
);

export const receiptLargeAmount: FormattedReceipt = (() => {
    const formatted = formatReceiptData({ ...baseSolReceipt, total: 100000000000000 }, CLUSTER);
    return {
        ...formatted,
        receiver: { ...formatted.receiver, truncated: raw.receiver },
    };
})();

export const receiptLargeAmountWithMemo: FormattedReceipt = formatReceiptData(
    { ...baseSolReceipt, memo: 'Large transfer', total: 100000000000 },
    CLUSTER
);

export const receiptWithDomains: FormattedReceipt = (() => {
    const formatted = formatReceiptData({ ...baseSolReceipt, total: 2500000000 }, CLUSTER);
    return {
        ...formatted,
        receiver: { ...formatted.receiver, domain: 'bob.sol' },
        sender: { ...formatted.sender, domain: 'alex.sol' },
    };
})();

const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_LOGO =
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU/logo.png';

export const receiptTokenTransfer: FormattedReceipt = formatReceiptData(
    {
        date: raw.date,
        fee: 5000,
        logoURI: USDC_LOGO,
        mint: USDC_MINT,
        receiver: raw.receiver,
        sender: raw.sender,
        symbol: 'USDC',
        total: 1250.75,
        type: 'token',
    },
    CLUSTER
);

export const receiptTokenTransferSimple: FormattedReceipt = formatReceiptData(
    {
        date: raw.date,
        fee: 5000,
        logoURI: undefined,
        memo: longMemoText,
        mint: undefined,
        receiver: raw.receiver,
        sender: raw.sender,
        symbol: 'USDC',
        total: 1250.75,
        type: 'token',
    },
    CLUSTER
);

export function forBaseReceipt(
    data: FormattedReceipt,
    overrides?: Partial<FormattedExtendedReceipt>
): FormattedExtendedReceipt {
    return {
        ...data,
        confirmationStatus: 'finalized',
        receiverHref: 'https://example.com/receiver',
        senderHref: 'https://example.com/sender',
        ...overrides,
    };
}
