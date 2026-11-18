import { ChainId } from '@entities/chain-id/@x/token-info';

export function jupiterListsTokensOn(chainId: ChainId): boolean {
    return chainId === ChainId.MAINNET;
}
