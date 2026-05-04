import { TransactionsProvider } from '@providers/transactions';

import { AccountsProvider } from '../providers/accounts';

export default function TxLayout({ children }: { children: React.ReactNode }) {
    return (
        <TransactionsProvider>
            <AccountsProvider>{children}</AccountsProvider>
        </TransactionsProvider>
    );
}
