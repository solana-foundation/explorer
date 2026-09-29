import type { InstructionArg } from '@entities/instruction-card';
import {
    PMP_COMPRESSION_LABELS,
    PMP_DATA_SOURCE_LABELS,
    PMP_ENCODING_LABELS,
    PMP_FORMAT_LABELS,
} from '@entities/pmp-account';

import type { PmpContentInstruction } from './types';

export function pmpArgs(pmpIx: PmpContentInstruction): InstructionArg[] {
    if (pmpIx.kind === 'write') {
        return [textArg({ name: 'offset', type: 'number', value: String(pmpIx.offset) })];
    }
    const args: InstructionArg[] = [
        textArg({ name: 'encoding', type: 'enum', value: PMP_ENCODING_LABELS[pmpIx.config.encoding] }),
        textArg({ name: 'compression', type: 'enum', value: PMP_COMPRESSION_LABELS[pmpIx.config.compression] }),
        textArg({ name: 'format', type: 'enum', value: PMP_FORMAT_LABELS[pmpIx.config.format] }),
    ];
    if (pmpIx.kind === 'initialize') {
        args.unshift({ kind: 'leaf', name: 'seed', type: 'string', value: { kind: 'string', value: pmpIx.seed } });
    }
    if (pmpIx.payload !== undefined) {
        args.push(
            textArg({ name: 'dataSource', type: 'enum', value: PMP_DATA_SOURCE_LABELS[pmpIx.payload.dataSource] }),
        );
    }
    return args;
}

function textArg({ name, type, value }: { name: string; type: string; value: string }): InstructionArg {
    return { kind: 'leaf', name, type, value: { kind: 'text', value } };
}
