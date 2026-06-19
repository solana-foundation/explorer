import { displayTimestamp } from '@utils/date';

import type { Lockout } from '../../lib/instruction-types';
import { DetailHashRow, DetailRow } from './DetailRow';

// Shared rows for the tower payload of updatevotestate*/towersync* instructions.
export function VoteStateRows({
    voteState,
}: {
    voteState: {
        blockId?: string;
        hash: string;
        lockouts: Lockout[];
        root?: number | null;
        timestamp?: number | null;
    };
}) {
    return (
        <>
            <DetailHashRow label="Vote Hash" hash={voteState.hash} />
            {voteState.blockId !== undefined && <DetailHashRow label="Block Id" hash={voteState.blockId} />}
            {voteState.root !== undefined && voteState.root !== null && (
                <DetailRow label="Root Slot" monospace>
                    {voteState.root}
                </DetailRow>
            )}
            {voteState.timestamp ? (
                <DetailRow label="Timestamp" monospace>
                    {displayTimestamp(voteState.timestamp * 1000)}
                </DetailRow>
            ) : undefined}
            <DetailRow label="Slots (Confirmation Count)" monospace>
                <pre className="mb-0 inline-block text-left">
                    {voteState.lockouts.map(lockout => `${lockout.slot} (${lockout.confirmation_count})`).join('\n')}
                </pre>
            </DetailRow>
        </>
    );
}
