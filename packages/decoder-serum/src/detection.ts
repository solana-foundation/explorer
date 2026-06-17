import { decodeInstruction, MARKETS } from '@project-serum/serum';
import { TransactionInstruction } from '@solana/web3.js';

import { DEPRECATED_SERUM_PROGRAM_IDS, SERUM_PROGRAM_IDS } from './config';

export function isSerumInstruction(instruction: TransactionInstruction): boolean {
    return (
        SERUM_PROGRAM_IDS.includes(instruction.programId.toBase58()) ||
        MARKETS.some(market => market.programId && market.programId.equals(instruction.programId))
    );
}

export function isDeprecatedSerumProgram(programId: string): boolean {
    return DEPRECATED_SERUM_PROGRAM_IDS.includes(programId);
}

export function parseSerumInstructionKey(instruction: TransactionInstruction): string {
    const decoded = decodeInstruction(instruction.data);
    const keys = Object.keys(decoded);

    if (keys.length < 1) {
        throw new Error('Serum instruction key not decoded');
    }

    return keys[0];
}

const SERUM_CODE_LOOKUP: { [key: number]: string } = {
    0: 'Initialize Market',
    1: 'New Order',
    10: 'New Order v3',
    11: 'Cancel Order v2',
    12: 'Cancel Order by Client Id v2',
    13: 'Send Take',
    14: 'Close Open Orders',
    15: 'Init Open Orders',
    16: 'Prune',
    17: 'Consume Events Permissioned',
    2: 'Match Orders',
    3: 'Consume Events',
    4: 'Cancel Order',
    5: 'Settle Funds',
    6: 'Cancel Order by Client Id',
    7: 'Disable Market',
    8: 'Sweep Fees',
    9: 'New Order v2',
};

function readUint32LE(bytes: Uint8Array, offset: number): number {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getUint32(offset, true);
}

export function parseSerumInstructionCode(instruction: TransactionInstruction): number {
    return readUint32LE(instruction.data.slice(1, 5), 0);
}

export function parseSerumInstructionTitle(instruction: TransactionInstruction): string {
    const code = parseSerumInstructionCode(instruction);

    if (!(code in SERUM_CODE_LOOKUP)) {
        throw new Error(`Unrecognized Serum instruction code: ${code}`);
    }

    return SERUM_CODE_LOOKUP[code];
}
