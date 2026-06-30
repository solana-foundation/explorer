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
    for (let i = 0; i < transactions.length; i++) {
        const slot = transactions[i].slot;
        const slotTransactions = [transactions[i]];
        while (i + 1 < transactions.length) {
            const nextSlot = transactions[i + 1].slot;
            if (nextSlot !== slot) break;
            slotTransactions.push(transactions[++i]);
        }

        for (const slotTransaction of slotTransactions) {
            let statusText;
            let statusClass;
            if (slotTransaction.err) {
                statusClass = 'warning';
                statusText = 'Failed';
            } else {
                statusClass = 'success';
                statusText = 'Success';
            }
            transactionRows.push({
                blockTime: slotTransaction.blockTime,
                err: slotTransaction.err,
                signature: slotTransaction.signature,
                signatureInfo: slotTransaction,
                slot,
                statusClass,
                statusText,
            });
        }
    }

    return transactionRows;
}
