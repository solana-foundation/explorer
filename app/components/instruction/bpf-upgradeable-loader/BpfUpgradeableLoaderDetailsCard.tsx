import {
    address,
    InstructionCardView,
    type InstructionField,
    InstructionFields,
    type InstructionNode,
    preformatted,
    text,
    UnknownDetailsCard,
    useInstructionSurface,
} from '@entities/instruction-card';
import { ParsedInstruction, PublicKey } from '@solana/web3.js';
import { camelToTitleCase, wrap } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import { create, is } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import {
    CloseInfo,
    DeployWithMaxDataLenInfo,
    ExtendProgramInfo,
    InitializeBufferInfo,
    SetAuthorityCheckedInfo,
    SetAuthorityInfo,
    UpgradeableBpfLoaderInstructionType,
    UpgradeInfo,
    WriteInfo,
} from './types';

type DetailsProps = {
    node: InstructionNode;
    ix: ParsedInstruction;
};

export function BpfUpgradeableLoaderDetailsCard({ node, ix }: DetailsProps) {
    const { signature } = useInstructionSurface();

    try {
        const parsed = create(ix.parsed, ParsedInfo);
        if (!is(parsed.type, UpgradeableBpfLoaderInstructionType)) {
            return <UnknownDetailsCard node={node} />;
        }
        const info = decodeInfo(parsed.type, parsed.info);

        return (
            <InstructionCardView node={node} title={`BPF Upgradeable Loader: ${camelToTitleCase(parsed.type)}`}>
                <InstructionFields programId={node.programId} fields={infoFields(info)} />
            </InstructionCardView>
        );
    } catch (error) {
        Logger.error(error, { signature });
        return <UnknownDetailsCard node={node} />;
    }
}

function decodeInfo(type: UpgradeableBpfLoaderInstructionType, info: unknown): object {
    switch (type) {
        case 'initializeBuffer':
            return create(info, InitializeBufferInfo);
        case 'write':
            return create(info, WriteInfo);
        case 'deployWithMaxDataLen':
            return create(info, DeployWithMaxDataLenInfo);
        case 'upgrade':
            return create(info, UpgradeInfo);
        case 'setAuthority':
            return create(info, SetAuthorityInfo);
        case 'setAuthorityChecked':
            return create(info, SetAuthorityCheckedInfo);
        case 'close':
            return create(info, CloseInfo);
        case 'extendProgram':
            return create(info, ExtendProgramInfo);
    }
}

function infoFields(info: object): InstructionField[] {
    return Object.entries(info).flatMap(([key, value]): InstructionField[] => {
        const label = camelToTitleCase(key);
        if (value === undefined) return [];
        if (value === null) return [text(label, '(none)')];
        if (value instanceof PublicKey) return [address(label, value)];
        if (key === 'bytes' && typeof value === 'string') return [preformatted(`${label} (Base 64)`, wrap(value, 50))];
        if (typeof value === 'string' || typeof value === 'number') return [text(label, value)];
        throw new Error(`BPF Upgradeable Loader field ${key} has no row format`);
    });
}
