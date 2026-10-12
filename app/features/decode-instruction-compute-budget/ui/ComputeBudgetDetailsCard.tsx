import {
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    sol,
    text,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';
import { microLamportsToLamportsString } from '@utils/index';
import React from 'react';

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
    /** The dispatcher's verdict for a Compute Budget instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function ComputeBudgetDetailsCard({ ix, raw, index, innerCards, childIndex }: ComputeBudgetDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };

    if ('unknown' in ix) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const parsed = ix.parsed as ComputeBudgetParsed;
    switch (parsed.type) {
        case 'requestUnits':
            return <RequestUnitsCard info={parsed.info} node={node} />;
        case 'requestHeapFrame':
            return <RequestHeapFrameCard info={parsed.info} node={node} />;
        case 'setComputeUnitLimit':
            return <SetComputeUnitLimitCard info={parsed.info} node={node} />;
        case 'setComputeUnitPrice':
            return <SetComputeUnitPriceCard info={parsed.info} node={node} />;
        case 'setLoadedAccountsDataSizeLimit':
            return <SetLoadedAccountsDataSizeLimitCard info={parsed.info} node={node} />;
    }
}
