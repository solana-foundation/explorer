import { useAccountInfo } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';

export function useAccountFetching(address: string | undefined): boolean {
    return useAccountInfo(address)?.status === FetchStatus.Fetching;
}
