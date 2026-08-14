import type { PmpAccountReadResult } from '@entities/pmp-account';

import { BasePmpAccountDataCard, NoteRow, PMP_CARD_TITLE } from './BasePmpAccountDataCard';

export function PmpAccountNoticeCard({
    result,
}: {
    result: Extract<PmpAccountReadResult, { kind: 'absent' | 'empty' | 'unreadable' }>;
}) {
    return (
        <BasePmpAccountDataCard title={result.kind === 'empty' ? `${PMP_CARD_TITLE}: Empty` : PMP_CARD_TITLE}>
            {result.kind === 'empty' ? (
                <NoteRow testId="pmp-account-empty-note" variant="default">
                    This account is allocated but has not been written yet.
                </NoteRow>
            ) : (
                <NoteRow testId="pmp-account-unreadable-note" variant="warning">
                    Could not read this Program Metadata account
                    {result.kind === 'unreadable' ? `: ${result.reason}` : ''}.
                </NoteRow>
            )}
        </BasePmpAccountDataCard>
    );
}
