import {
    address,
    defineInstructionCard,
    preformatted,
    text,
    toInstructionNode,
    UnknownDetailsCard,
} from '@entities/instruction-card';
import { ParsedInstruction, ParsedTransaction } from '@solana/web3.js';
import { wrap } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import { create } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { FinalizeInfo, WriteInfo } from './types';

type DetailsProps = {
    tx: ParsedTransaction;
    ix: ParsedInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function BpfLoaderDetailsCard({ childIndex, index, innerCards, ix, tx }: DetailsProps) {
    const node = toInstructionNode({ childIndex, index, innerCards, ix });

    try {
        const parsed = create(ix.parsed, ParsedInfo);

        switch (parsed.type) {
            case 'write': {
                const info = create(parsed.info, WriteInfo);
                return <BpfLoaderWriteDetailsCard info={info} node={node} />;
            }
            case 'finalize': {
                const info = create(parsed.info, FinalizeInfo);
                return <BpfLoaderFinalizeDetailsCard info={info} node={node} />;
            }
            default:
                return <UnknownDetailsCard node={node} />;
        }
    } catch (error) {
        Logger.error(error, {
            signature: tx.signatures[0],
        });
        return <UnknownDetailsCard node={node} />;
    }
}

export const BpfLoaderWriteDetailsCard = defineInstructionCard<WriteInfo>({
    fields: info => [
        address('Account', info.account),
        preformatted('Bytes (Base 64)', wrap(info.bytes, 50)),
        text('Offset', info.offset),
    ],
    title: 'BPF Loader 2: Write',
});

export const BpfLoaderFinalizeDetailsCard = defineInstructionCard<FinalizeInfo>({
    fields: info => [address('Account', info.account)],
    title: 'BPF Loader 2: Finalize',
});
