import {
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    sol,
    text,
} from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';
import { microLamportsToLamportsString } from '@utils/index';

import type {
    ComputeBudgetParsed,
    RequestHeapFrameInfo,
    RequestUnitsInfo,
    SetComputeUnitLimitInfo,
    SetComputeUnitPriceInfo,
    SetLoadedAccountsDataSizeLimitInfo,
} from '../lib/compute-budget-parser';

const TITLE_PREFIX = 'Compute Budget Program';

const formatUnits = (units: number) => `${new Intl.NumberFormat('en-US').format(units)} compute units`;

const RequestUnitsCard = defineInstructionCard<RequestUnitsInfo>({
    fields: info => [
        text('Requested Compute Units', formatUnits(info.units)),
        sol('Additional Fee (SOL)', info.additionalFee),
    ],
    title: `${TITLE_PREFIX}: Request Units (Deprecated)`,
});

const RequestHeapFrameCard = defineInstructionCard<RequestHeapFrameInfo>({
    fields: info => [text('Requested Heap Frame (Bytes)', new Intl.NumberFormat('en-US').format(info.bytes))],
    title: `${TITLE_PREFIX}: Request Heap Frame`,
});

const SetComputeUnitLimitCard = defineInstructionCard<SetComputeUnitLimitInfo>({
    fields: info => [text('Compute Unit Limit', formatUnits(info.units))],
    title: `${TITLE_PREFIX}: Set Compute Unit Limit`,
});

const SetComputeUnitPriceCard = defineInstructionCard<SetComputeUnitPriceInfo>({
    fields: info => [
        text('Compute Unit Price', `${microLamportsToLamportsString(info.microLamports)} lamports per compute unit`),
    ],
    title: `${TITLE_PREFIX}: Set Compute Unit Price`,
});

const SetLoadedAccountsDataSizeLimitCard = defineInstructionCard<SetLoadedAccountsDataSizeLimitInfo>({
    fields: info => [text('Account Data Size Limit', `${info.accountDataSizeLimit} bytes`)],
    title: `${TITLE_PREFIX}: Set Loaded Account Data Size Limit`,
});

type ComputeBudgetDetailsCardProps = {
    node: InstructionNode;
    /** `undefined` when the parser of the program cannot decode the instruction. */
    parsed: ParsedInstructionInfo | undefined;
};

export function ComputeBudgetDetailsCard({ node, parsed }: ComputeBudgetDetailsCardProps) {
    if (!parsed) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} />;
    }

    const parsedInfo = parsed as ComputeBudgetParsed;
    switch (parsedInfo.type) {
        case 'requestUnits':
            return <RequestUnitsCard info={parsedInfo.info} node={node} />;
        case 'requestHeapFrame':
            return <RequestHeapFrameCard info={parsedInfo.info} node={node} />;
        case 'setComputeUnitLimit':
            return <SetComputeUnitLimitCard info={parsedInfo.info} node={node} />;
        case 'setComputeUnitPrice':
            return <SetComputeUnitPriceCard info={parsedInfo.info} node={node} />;
        case 'setLoadedAccountsDataSizeLimit':
            return <SetLoadedAccountsDataSizeLimitCard info={parsedInfo.info} node={node} />;
    }
}
