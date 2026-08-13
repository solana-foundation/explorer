import { RawDataField } from '@components/shared/RawDataField';

import { BaseTable } from '@/app/shared/ui/Table';

import { CARD_TABLE_COLUMNS } from '../BasePmpAccountDataCard';

const PMP_PAYLOAD_DOWNLOAD_FILENAME = 'pmp-account-payload';

/**
 * Bytes with no readable document form.
 */
export function RawPayloadRow({ bytes }: { bytes: Uint8Array }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS}>
                <div data-testid="pmp-account-raw">
                    <RawDataField data={bytes} filename={PMP_PAYLOAD_DOWNLOAD_FILENAME} />
                </div>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
