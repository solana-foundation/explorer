import { ChainId } from '@entities/chain-id/@x/token-info';

export function jupiterListsTokensOn(chainId: ChainId | undefined): boolean {
    return chainId === ChainId.MAINNET;
}
