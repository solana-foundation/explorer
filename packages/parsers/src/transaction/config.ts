import {
    type CompiledTransactionConfigValue,
    type CompiledTransactionMessage,
    decompileTransactionConfig,
    getTransactionConfigMask,
    getTransactionConfigValues,
    isSolanaError,
    SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS,
    SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND,
} from '@solana/kit';

import { InvalidTransactionConfigError } from './errors.js';
import type { ParsedTransaction, RpcTransactionConfig, TransactionConfig } from './types.js';

/**
 * Returns `undefined` for a legacy or v0 message, and for a v1 message that sets no limits.
 * Throws `InvalidTransactionConfigError` when the mask sets an unknown bit or the config values do not match it.
 */
export function readTransactionConfig(message: CompiledTransactionMessage): TransactionConfig | undefined {
    if (message.version !== 1) return undefined;
    const { configMask, configValues } = message;

    const config = decompileConfig(configMask, configValues);

    // `decompileTransactionConfig` accepts unknown mask bits and extra values. A round trip rejects both.
    if (getTransactionConfigMask(config) !== configMask) {
        throw new InvalidTransactionConfigError(`Invalid transaction config mask: ${configMask}.`);
    }
    const declared = getTransactionConfigValues(config).length;
    if (declared !== configValues.length) {
        throw new InvalidTransactionConfigError(
            `Config value count ${configValues.length} does not match the mask, which declares ${declared}.`,
        );
    }

    return declared > 0 ? config : undefined;
}

const RPC_CONFIG_FIELDS = [
    ['priorityFee', 'priorityFeeLamports'],
    ['computeUnitLimit', 'computeUnitLimit'],
    ['loadedAccountsDataSizeLimit', 'loadedAccountsDataSizeLimit'],
    ['heapSize', 'heapSize'],
] as const;

export function fromRpcTransactionConfig(config: RpcTransactionConfig | undefined): TransactionConfig | undefined {
    if (!config) return undefined;

    const mapped: TransactionConfig = {};
    for (const [rpcField, field] of RPC_CONFIG_FIELDS) {
        const value = config[rpcField];
        if (value !== null) Object.assign(mapped, { [field]: value });
    }

    return Object.keys(mapped).length > 0 ? mapped : undefined;
}

export function getTransactionConfig(transaction: ParsedTransaction): TransactionConfig | undefined {
    return transaction.version === 1 ? transaction.config : undefined;
}

function decompileConfig(configMask: number, configValues: CompiledTransactionConfigValue[]): TransactionConfig {
    try {
        return decompileTransactionConfig(configMask, configValues);
    } catch (error) {
        if (isSolanaError(error, SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_VALUE_KIND)) {
            const { actualKind, configName, expectedKind } = error.context;
            throw new InvalidTransactionConfigError(
                `Config value for ${configName} is ${actualKind}, expected ${expectedKind}.`,
                { cause: error },
            );
        }
        if (isSolanaError(error, SOLANA_ERROR__TRANSACTION__INVALID_CONFIG_MASK_PRIORITY_FEE_BITS)) {
            throw new InvalidTransactionConfigError(`Invalid transaction config mask: ${configMask}.`, {
                cause: error,
            });
        }
        // Reached when the mask declares more values than `configValues` holds.
        throw new InvalidTransactionConfigError(`Config values are fewer than the mask ${configMask} declares.`, {
            cause: error,
        });
    }
}
