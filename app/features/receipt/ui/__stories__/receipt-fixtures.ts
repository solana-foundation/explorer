import { Cluster } from '@/app/utils/cluster';

import { formatReceiptData } from '../../model/create-receipt';
import type { Receipt } from '../../model/types';
import type { FormattedExtendedReceipt, FormattedReceipt } from '../../types';

const CLUSTER = Cluster.MainnetBeta;

// Fixed literal addresses so screenshot captures are deterministic (was Keypair.generate()).
const SENDER = 'UM1jjYaM2Y4BDSdCw3AiELrP6HDpz62VjUHcHVJosix';
const RECEIVER = 'UMxTDTS9cXEBVNkNmtaPKY4gZwwNrsLb6K7XiT3MnHP';
const EXTRA_RECEIVERS = [
    'UNuAhNHxEFQ2AT8MvxGKyCTuBW7TCRddJYRYVJSEr1p',
    'UPqtBH9dACJEh67Whonp2FczN8p8mci2tBicQpTDFb1',
    'UQnbfC1RmvU5NAVVrsUo2idHawqHdsPYoeS6LXk3RsS',
    'URjK96HJoqgNoA5vzFEyTvSTCDKw3yAnyCQP95LjdLq',
    'USg2d197RZrDUETv9JvxUPSkR2M5vTxCo1qyLUqFKR8',
    'UTck4LGQp2t9zBnXr99NfoKSkgiEHRzyiYnndSoMHsV',
    'UUZTYF8DRm3zfGAX1CqMgGKjyVjP9vnPYNENprKKHpU',
    'UVVydGP1WgMd5BfpNnrWzun5S6zHgmNvbNfmZVCUhSZ',
    'UWSh7BEp8QXTkG3oXrYW1NnNev1SZGALRC7MktiShPY',
];

const raw = {
    date: 1737100062,
    receiver: RECEIVER,
    sender: SENDER,
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
    'This is a longer description that demonstrates how the receipt component handles extended text content, including a couple of sentences about the purpose of the payment and any additional context relevant to the transaction.';

export const defaultReceipt: FormattedReceipt = formatReceiptData(baseSolReceipt, CLUSTER);

export const receiptWithMemo: FormattedReceipt = formatReceiptData(
    { ...baseSolReceipt, memo: longMemoText, total: 50000000000 },
    CLUSTER,
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
    CLUSTER,
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
    CLUSTER,
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
    CLUSTER,
);

export const receiptMultiTransfer3: FormattedReceipt = formatReceiptData(
    {
        ...baseSolReceipt,
        total: 350000000,
        transfers: [
            { receiver: EXTRA_RECEIVERS[0], sender: raw.sender, total: 100000000 },
            { receiver: EXTRA_RECEIVERS[1], sender: raw.sender, total: 50000000 },
            { receiver: EXTRA_RECEIVERS[2], sender: raw.sender, total: 200000000 },
        ],
    },
    CLUSTER,
);

export const receiptMultiTransfer9: FormattedReceipt = formatReceiptData(
    {
        ...baseSolReceipt,
        total: 1125000000,
        transfers: Array.from({ length: 9 }, (_, i) => ({
            receiver: EXTRA_RECEIVERS[i],
            sender: raw.sender,
            total: (i + 1) * 25000000,
        })),
    },
    CLUSTER,
);

export const receiptMultiTokenTransfer: FormattedReceipt = formatReceiptData(
    {
        date: raw.date,
        fee: 10001,
        logoURI: USDC_LOGO,
        mint: USDC_MINT,
        receiver: raw.receiver,
        sender: raw.sender,
        symbol: 'USDC',
        total: 1.000841,
        transfers: [
            { receiver: EXTRA_RECEIVERS[0], sender: raw.sender, total: 1 },
            { receiver: EXTRA_RECEIVERS[1], sender: raw.sender, total: 0.000841 },
        ],
        type: 'token',
    },
    CLUSTER,
);

export const receiptMultiTokenTransferWithMemo: FormattedReceipt = formatReceiptData(
    {
        date: raw.date,
        fee: 10001,
        logoURI: USDC_LOGO,
        memo: 'Payroll batch — Q2',
        mint: USDC_MINT,
        receiver: raw.receiver,
        sender: raw.sender,
        symbol: 'USDC',
        total: 1.000841,
        transfers: [
            { receiver: EXTRA_RECEIVERS[0], sender: raw.sender, total: 1 },
            { receiver: EXTRA_RECEIVERS[1], sender: raw.sender, total: 0.000841 },
        ],
        type: 'token',
    },
    CLUSTER,
);

export const receiptMultiTokenTransferWithLongMemo: FormattedReceipt = formatReceiptData(
    {
        date: raw.date,
        fee: 10001,
        logoURI: USDC_LOGO,
        memo: longMemoText,
        mint: USDC_MINT,
        receiver: raw.receiver,
        sender: raw.sender,
        symbol: 'USDC',
        total: 1.000841,
        transfers: [
            { receiver: EXTRA_RECEIVERS[0], sender: raw.sender, total: 1 },
            { receiver: EXTRA_RECEIVERS[1], sender: raw.sender, total: 0.000841 },
        ],
        type: 'token',
    },
    CLUSTER,
);

export const mixedMintNoReceiptMessage =
    'Receipts are only available when all token transfers in a transaction use the same mint. This transaction transfers multiple different tokens.';

export const innerInstructionsNoReceiptMessage =
    'Receipts are only available for simple transfers. This transaction contains inner program instructions.';

export function forBaseReceipt(
    data: FormattedReceipt,
    overrides?: Partial<FormattedExtendedReceipt>,
): FormattedExtendedReceipt {
    return {
        ...data,
        confirmationStatus: 'finalized',
        receiverHref: 'https://example.com/receiver',
        senderHref: 'https://example.com/sender',
        ...overrides,
    };
}
