import { TableCardBody } from '@components/common/TableCardBody';
import { ProgramField } from '@entities/instruction-card';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { TransactionInstruction } from '@solana/web3.js';

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
                <>
                    <span className="badge bg-info-soft me-2">#{index + 1}</span>
                    {programName} Instruction
                </>
            }
        >
            <TableCardBody>
                <ProgramField programId={ix.programId} showExtendedInfo />
                <BaseRawDetails ix={ix} />
                {innerCards && innerCards.length > 0 && (
                    <>
                        <tr className="table-sep">
                            <td colSpan={3}>Inner Instructions</td>
                        </tr>
                        <tr>
                            <td colSpan={3}>
                                <div className="inner-cards !e-m-0">{innerCards}</div>
                            </td>
                        </tr>
                    </>
                )}
            </TableCardBody>
        </CollapsibleCard>
    );
}
