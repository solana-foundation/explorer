import { TruncatedValue } from '@components/shared/TruncatedValue';

import { BaseTable } from '@/app/shared/ui/Table';

const HASH_MID_TRUNCATE_CHARS = 8;

/**
 * The sha256 digest over the UNPACKED payload bytes.
 */
export function PayloadHashRow({ columns, hash }: { columns: number; hash: string }) {
    return (
        <BaseTable.Row data-testid="pmp-payload-data-hash">
            <BaseTable.Cell>Data Hash</BaseTable.Cell>
            <BaseTable.Cell className="md:text-right" colSpan={columns - 1}>
                <TruncatedValue
                    value={hash}
                    truncation={{ enabled: true, midTruncateChars: HASH_MID_TRUNCATE_CHARS }}
                    alignRight
                />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
