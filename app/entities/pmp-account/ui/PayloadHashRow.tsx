import { HashValue } from '@components/common/HashValue';

import { BaseTable } from '@/app/shared/ui/Table';

/**
 * The sha256 digest over the UNPACKED payload bytes.
 */
export function PayloadHashRow({ columns, hash }: { columns: number; hash: string }) {
    return (
        <BaseTable.Row data-testid="pmp-payload-data-hash">
            <BaseTable.Cell>Data Hash</BaseTable.Cell>
            <BaseTable.Cell className="md:text-right" colSpan={columns - 1}>
                <HashValue value={hash} alignRight />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
