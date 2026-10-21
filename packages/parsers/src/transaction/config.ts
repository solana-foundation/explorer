import {
    type CompiledTransactionMessage,
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK,
    TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK,
    TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK,
    transactionConfigMaskHasComputeUnitLimit,
    transactionConfigMaskHasHeapSize,
    transactionConfigMaskHasLoadedAccountsDataSizeLimit,
    transactionConfigMaskHasPriorityFee,
} from '@solana/kit';

import { InvalidTransactionConfigError } from './errors.js';
import type { ParsedTransaction, RpcTransactionConfig, TransactionConfig } from './types.js';

// Mask bit order is the value order on the wire.
const CONFIG_FIELDS = [
    ['priorityFeeLamports', 'u64', transactionConfigMaskHasPriorityFee],
    ['computeUnitLimit', 'u32', transactionConfigMaskHasComputeUnitLimit],
    ['loadedAccountsDataSizeLimit', 'u32', transactionConfigMaskHasLoadedAccountsDataSizeLimit],
    ['heapSize', 'u32', transactionConfigMaskHasHeapSize],
] as const;

const KNOWN_CONFIG_MASK_BITS =
    TRANSACTION_CONFIG_PRIORITY_FEE_LAMPORTS_BIT_MASK |
    TRANSACTION_CONFIG_COMPUTE_UNIT_LIMIT_BIT_MASK |
    TRANSACTION_CONFIG_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT_MASK |
    TRANSACTION_CONFIG_HEAP_SIZE_BIT_MASK;

/**
 * Returns `undefined` for a legacy or v0 message, and for a v1 message that sets no limits.
 * Throws `InvalidTransactionConfigError` when the mask sets an unknown bit or the config values do not match it.
 *
 * Deliberately not kit's `decompileTransactionMessage`, which throws on an out-of-range account index
 * and costs a full message decompile per call.
 */
export function readTransactionConfig(message: CompiledTransactionMessage): TransactionConfig | undefined {
    if (message.version !== 1) return undefined;
    if (hasUnknownBits(message.configMask)) {
        throw new InvalidTransactionConfigError(`Invalid transaction config mask: ${message.configMask}.`);
    }

    const config: TransactionConfig = {};
    let valueIndex = 0;

    for (const [field, kind, maskHasField] of CONFIG_FIELDS) {
        let present: boolean;
        try {
            // The priority-fee predicate throws when only one of its two mask bits is set.
            present = maskHasField(message.configMask);
        } catch (error) {
            throw new InvalidTransactionConfigError(`Invalid transaction config mask: ${message.configMask}.`, {
                cause: error,
            });
        }
        if (!present) continue;

        const value = message.configValues[valueIndex++];
        if (value?.kind !== kind) {
            throw new InvalidTransactionConfigError(
                `Config value for ${field} is ${value?.kind ?? 'missing'}, expected ${kind}.`,
            );
        }
        Object.assign(config, { [field]: value.value });
    }

    if (valueIndex !== message.configValues.length) {
        throw new InvalidTransactionConfigError(
            `Config value count ${message.configValues.length} does not match the mask, which declares ${valueIndex}.`,
        );
    }

    return valueIndex > 0 ? config : undefined;
}

function hasUnknownBits(configMask: number): boolean {
    return (configMask & ~KNOWN_CONFIG_MASK_BITS) !== 0;
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
