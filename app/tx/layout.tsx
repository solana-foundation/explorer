import { TransactionsProvider } from '@providers/transactions';

import { AccountsProvider } from '../providers/accounts';
import { TxInstructionParserProvider } from './instruction-parser-provider';

export default function TxLayout({ children }: { children: React.ReactNode }) {
    return (
        <TransactionsProvider>
            <AccountsProvider>
                <TxInstructionParserProvider>{children}</TxInstructionParserProvider>
            </AccountsProvider>
        </TransactionsProvider>
    );
}
