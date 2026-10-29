import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { InstructionNodeCard } from '@components/instruction/InstructionNodeCard';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { instructionDataOf, InstructionNodeCards, TxInstructionSurface } from '@entities/instruction-card';
import { trustedInnerInstructions } from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails, useTransactionStatus } from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import { SignatureProps } from '@utils/index';
import React from 'react';

import { toInstructionNodes } from '../lib/instruction-nodes';

export function InstructionsSection({ signature }: SignatureProps) {
    const status = useTransactionStatus(signature);
    const details = useTransactionDetails(signature);
    const { cluster } = useCluster();
    const fetchDetails = useFetchTransactionDetails();
    const refreshDetails = () => fetchDetails(signature);

    const result = status?.data?.info?.result;
    const transactionWithMeta = details?.data?.transactionWithMeta;
    const nodes = React.useMemo(
        () =>
            transactionWithMeta &&
            toInstructionNodes(
                transactionWithMeta.transaction,
                trustedInnerInstructions(transactionWithMeta.meta?.innerInstructions, {
                    cluster,
                    slot: transactionWithMeta.slot,
                }),
            ),
        [cluster, transactionWithMeta],
    );
    const instructionData = React.useMemo(() => instructionDataOf(nodes ?? []), [nodes]);

    if (!result || !nodes || nodes.length === 0) {
        return <ErrorCard retry={refreshDetails} text="No instructions found" />;
    }

    return (
        <CollapsibleSection id="programs" title="Programs" className="">
            <TxInstructionSurface
                result={result}
                signature={signature}
                Card={InstructionNodeCard}
                instructionData={instructionData}
            >
                <React.Suspense fallback={<LoadingCard message="Loading Instructions" />}>
                    <InstructionNodeCards nodes={nodes} />
                </React.Suspense>
            </TxInstructionSurface>
        </CollapsibleSection>
    );
}
