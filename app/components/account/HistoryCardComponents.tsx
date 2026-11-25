import { ConfirmedSignatureInfo, TransactionError } from '@solana/web3.js';

export type TransactionRow = {
    slot: number;
    signature: string;
    err: TransactionError | null;
    blockTime: number | null | undefined;
    statusClass: string;
    statusText: string;
    signatureInfo: ConfirmedSignatureInfo;
};

export function getTransactionRows(transactions: ConfirmedSignatureInfo[]): TransactionRow[] {
    const transactionRows: TransactionRow[] = [];
    for (const transaction of transactions) {
        let statusText;
        let statusClass;
        if (transaction.err) {
            statusClass = 'warning';
            statusText = 'Failed';
        } else {
            statusClass = 'success';
            statusText = 'Success';
        }
        transactionRows.push({
            blockTime: transaction.blockTime,
            err: transaction.err,
            signature: transaction.signature,
            signatureInfo: transaction,
            slot: transaction.slot,
            statusClass,
            statusText,
        });
    }

    return transactionRows;
}
