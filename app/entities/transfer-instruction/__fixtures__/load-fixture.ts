import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

import devnetMultiSolMemoRaw from './devnet-multi-sol-memo-5PQcQh7w63DzgaSaovT5nLgyfciWm6fkyeBHwADoaVuesk8KAuwEK1v9gnruPfmoN4HseWMnPuZy5xjfxLazx5wt.json';
import devnetSingleSolMemoRaw from './devnet-single-sol-memo-2EhgNdNDaH2ArsoEChEFYMnNzu6qerQpqFP5auGQHXUDEz5CH4mGF1t3ga4tKsVrio3SSPDxSv8HYmURQu1TPTkJ.json';
import mainnetMultiSolRaw from './mainnet-multi-sol-2msqMqeUTTZhgite3PvWSLJhZJ3m4v4UMbDAcXymTPpXwKM5PcKfZFfxn4izZ2UTZmngYJeWSf1ztdD6kdeDkdbr.json';
import mainnetSingleSolRaw from './mainnet-single-sol-2kHbPUGzehenUXQbBfAVZGcuTrSUVDMEyU2aGcjFbuUAJkG28CyQPCGZF68u369MU7WHMvJboyioqyihvtR75nLn.json';
import mainnetSingleUsdcRaw from './mainnet-single-usdc-4LXpF3MCdp69iFmD27Sn812UNpqFPHM4qXH7Y12E964p9GHXvwMe1XEmyasogVT2N4XEctdQQLf1sHY6Gvsa5sFX.json';
import surfpoolMultiTransferRaw from './surfpool-multi-transfer-3p9fzShSPEC5ocZ52UqQBszEKrr6m1w5QwCFrChwQBgQAKbAG1dgMraQuXKtZhSvg6sSHZzaQvDjhh8wKCWL6f9D.json';

type WireInstruction = { programId: string; [extra: string]: unknown };
type WireAccountKey = { pubkey: string; [extra: string]: unknown };
type WireInnerGroup = { index: number; instructions: WireInstruction[] };

type WireParsedTransaction = {
    blockTime: number;
    slot: number;
    version: number | 'legacy';
    meta: {
        innerInstructions: WireInnerGroup[];
        [extra: string]: unknown;
    };
    transaction: {
        message: {
            accountKeys: WireAccountKey[];
            instructions: WireInstruction[];
            recentBlockhash: string;
        };
        signatures: string[];
    };
};

type WireRpcResponse = { result: WireParsedTransaction };

const hydrateInstruction = (ix: WireInstruction) => ({ ...ix, programId: new PublicKey(ix.programId) });

function hydrate({ result }: WireRpcResponse): ParsedTransactionWithMeta {
    return {
        ...result,
        meta: {
            ...result.meta,
            innerInstructions: result.meta.innerInstructions.map(g => ({
                ...g,
                instructions: g.instructions.map(hydrateInstruction),
            })),
        },
        transaction: {
            ...result.transaction,
            message: {
                ...result.transaction.message,
                accountKeys: result.transaction.message.accountKeys.map(k => ({
                    ...k,
                    pubkey: new PublicKey(k.pubkey),
                })),
                instructions: result.transaction.message.instructions.map(hydrateInstruction),
            },
        },
    } as ParsedTransactionWithMeta;
}

export const surfpoolMultiTransferTx = hydrate(surfpoolMultiTransferRaw as unknown as WireRpcResponse);
export const mainnetSingleSolTx = hydrate(mainnetSingleSolRaw as unknown as WireRpcResponse);
export const mainnetSingleUsdcTx = hydrate(mainnetSingleUsdcRaw as unknown as WireRpcResponse);
export const devnetSingleSolMemoTx = hydrate(devnetSingleSolMemoRaw as unknown as WireRpcResponse);
export const mainnetMultiSolTx = hydrate(mainnetMultiSolRaw as unknown as WireRpcResponse);
export const devnetMultiSolMemoTx = hydrate(devnetMultiSolMemoRaw as unknown as WireRpcResponse);
