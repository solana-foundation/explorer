import { TruncatedValue } from '@components/shared/TruncatedValue';
import { DataSource } from '@solana-program/program-metadata';

import { BaseTable } from '@/app/shared/ui/Table';

import { PMP_POINTER_HASH_NOTES } from '../lib/constants';

const HASH_MID_TRUNCATE_CHARS = 8;

/**
 * The sha256 digest over the UNPACKED payload bytes.
 * A non-Direct payload stores a pointer, so it reports why there is no hash rather than digesting the reference.
 * An undefined `dataSource` is unresolved, not a pointer, so it still shows the digest.
 */
export function PayloadHashRow({
    columns,
    dataSource,
    hash,
}: {
    columns: number;
    dataSource?: DataSource;
    hash: string;
}) {
    const pointerNote =
        dataSource === undefined || dataSource === DataSource.Direct ? undefined : PMP_POINTER_HASH_NOTES[dataSource];

    return (
        <BaseTable.Row data-testid="pmp-payload-data-hash">
            <BaseTable.Cell>Data Hash</BaseTable.Cell>
            <BaseTable.Cell className="md:text-right" colSpan={columns - 1}>
                {pointerNote !== undefined ? (
                    <span data-testid="pmp-payload-data-hash-pointer" className="text-xs text-neutral-500">
                        {pointerNote}
                    </span>
                ) : (
                    <TruncatedValue
                        value={hash}
                        truncation={{ enabled: true, midTruncateChars: HASH_MID_TRUNCATE_CHARS }}
                        alignRight
                    />
                )}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
