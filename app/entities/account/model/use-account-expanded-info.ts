import { Account } from '@providers/accounts';

import { useAccountQuery } from './use-account-query';

export function useAccountExpandedInfo(address: string, enabled: boolean) {
    const key = enabled ? ([address] as const) : undefined;
    return useAccountQuery<Account>(key, {
        dataMode: 'parsed',
        select: account => account,
    });
}
