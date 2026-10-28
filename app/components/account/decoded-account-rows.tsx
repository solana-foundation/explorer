import { KitAddress } from '@components/common/KitAddress';
import { BN } from '@coral-xyz/anchor';
import { FieldValueView, type InstructionArg, parseCodamaArgs } from '@entities/instruction-card';
import { PublicKey } from '@solana/web3.js';

import type { KeyValueRow } from '@/app/shared/ui/key-value';

export function argsToRows(args: readonly InstructionArg[], prefix = ''): KeyValueRow[] {
    return args.flatMap(arg => {
        const label = prefix ? `${prefix}.${arg.name}` : arg.name;
        if (arg.kind === 'group') {
            const childRows = argsToRows(arg.children, label);
            return arg.variant ? [{ label, value: arg.variant }, ...childRows] : childRows;
        }
        if (arg.kind === 'empty') return [{ label, value: '—' }];
        const value =
            arg.value.kind === 'address' ? (
                <KitAddress address={arg.value.address} raw link />
            ) : (
                <FieldValueView value={arg.value} />
            );
        return [{ label, value }];
    });
}

export function codamaAccountRows(data: unknown): KeyValueRow[] {
    return argsToRows(parseCodamaArgs(data));
}

export function anchorAccountRows(data: unknown): KeyValueRow[] {
    return argsToRows(parseCodamaArgs(toPlainValue(data)));
}

export function toPlainValue(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof PublicKey) return value.toBase58();
    if (BN.isBN(value)) return BigInt(value.toString());
    if (value instanceof Uint8Array || Array.isArray(value)) return Array.from(value, toPlainValue);
    if (typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlainValue(item)]));
    }
    return value;
}
