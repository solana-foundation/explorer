import { adaptParsedTransaction } from '@entities/transaction-data';

import devnetMultiSolMemoRaw from './devnet-multi-sol-memo-5PQcQh7w63DzgaSaovT5nLgyfciWm6fkyeBHwADoaVuesk8KAuwEK1v9gnruPfmoN4HseWMnPuZy5xjfxLazx5wt.json';
import devnetSingleSolMemoRaw from './devnet-single-sol-memo-2EhgNdNDaH2ArsoEChEFYMnNzu6qerQpqFP5auGQHXUDEz5CH4mGF1t3ga4tKsVrio3SSPDxSv8HYmURQu1TPTkJ.json';
import devnetSolWithAtaRentRaw from './devnet-sol-with-ata-rent-4HobvUWLuUJBrquWBjiMjEnovTfmcm8fcjURmiK2wBV623jsUDUZfReKy1bQEPotkPdRWR1BMpyyXdMpyu7WMVFz.json';
import devnetTransferWithSeedRaw from './devnet-transfer-with-seed-4zZKwjedLM5cVxiuFxF9BgCGP29RYdH9KifKHk9pncmnoHwYNAiDaej8v7hDaMwhikbC1L4qzu2AsNVPZfXPEcBh.json';
import mainnetMultiSolRaw from './mainnet-multi-sol-2msqMqeUTTZhgite3PvWSLJhZJ3m4v4UMbDAcXymTPpXwKM5PcKfZFfxn4izZ2UTZmngYJeWSf1ztdD6kdeDkdbr.json';
import mainnetSingleSolRaw from './mainnet-single-sol-2kHbPUGzehenUXQbBfAVZGcuTrSUVDMEyU2aGcjFbuUAJkG28CyQPCGZF68u369MU7WHMvJboyioqyihvtR75nLn.json';
import mainnetSingleUsdcRaw from './mainnet-single-usdc-4LXpF3MCdp69iFmD27Sn812UNpqFPHM4qXH7Y12E964p9GHXvwMe1XEmyasogVT2N4XEctdQQLf1sHY6Gvsa5sFX.json';
import surfpoolMultiTransferRaw from './surfpool-multi-transfer-3p9fzShSPEC5ocZ52UqQBszEKrr6m1w5QwCFrChwQBgQAKbAG1dgMraQuXKtZhSvg6sSHZzaQvDjhh8wKCWL6f9D.json';

type RpcResponse = { result: Parameters<typeof adaptParsedTransaction>[0] };

const hydrate = ({ result }: RpcResponse) => adaptParsedTransaction(result);

export const surfpoolMultiTransferTx = hydrate(surfpoolMultiTransferRaw as unknown as RpcResponse);
export const mainnetSingleSolTx = hydrate(mainnetSingleSolRaw as unknown as RpcResponse);
export const mainnetSingleUsdcTx = hydrate(mainnetSingleUsdcRaw as unknown as RpcResponse);
export const devnetSingleSolMemoTx = hydrate(devnetSingleSolMemoRaw as unknown as RpcResponse);
export const mainnetMultiSolTx = hydrate(mainnetMultiSolRaw as unknown as RpcResponse);
export const devnetMultiSolMemoTx = hydrate(devnetMultiSolMemoRaw as unknown as RpcResponse);
export const devnetTransferWithSeedTx = hydrate(devnetTransferWithSeedRaw as unknown as RpcResponse);
export const devnetSolWithAtaRentTx = hydrate(devnetSolWithAtaRentRaw as unknown as RpcResponse);
