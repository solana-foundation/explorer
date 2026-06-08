import { TableCardBody } from '@components/common/TableCardBody';
import { ProgramField } from '@entities/instruction-card';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { TransactionInstruction } from '@solana/web3.js';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';
import getInstructionCardScrollAnchorId from '@/app/utils/get-instruction-card-scroll-anchor-id';

import { BaseRawDetails } from '../common/BaseRawDetails';

export function UnknownDetailsCard({
    index,
    ix,
    programName,
    innerCards,
}: {
    index: number;
    ix: TransactionInstruction;
    programName: string;
    innerCards?: React.ReactNode[];
}) {
    const scrollAnchorRef = useScrollAnchor(getInstructionCardScrollAnchorId([index + 1]));

    return (
        <CollapsibleCard
            ref={scrollAnchorRef}
            defaultExpanded={false}
            title={
                <span className="e-flex e-min-w-0 e-flex-1 e-items-center">
                    <Badge ui="dashkit" variant="info" className="e-mr-1.5 e-flex-none">
                        #{index + 1}
                    </Badge>
                    <span className="e-min-w-0 e-flex-1 e-overflow-hidden e-text-ellipsis e-whitespace-nowrap">
                        {programName}
                    </span>
                    <span className="e-ml-1.5 e-flex-none">Instruction</span>
                </span>
            }
        >
            <TableCardBody>
                <ProgramField programId={ix.programId} showExtendedInfo />
                <BaseRawDetails ix={ix} />
                {innerCards && innerCards.length > 0 && (
                    <>
                        <BaseTable.Row className="table-sep">
                            <BaseTable.Cell colSpan={3}>Inner Instructions</BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell colSpan={3}>
                                <div className="inner-cards !e-m-0">{innerCards}</div>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </>
                )}
            </TableCardBody>
        </CollapsibleCard>
    );
}
