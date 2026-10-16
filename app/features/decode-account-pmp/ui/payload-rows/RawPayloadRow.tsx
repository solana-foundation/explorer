import { RawDataField } from '@components/shared/RawDataField';

import { FullWidthRow } from '../BasePmpAccountDataCard';

const PMP_PAYLOAD_DOWNLOAD_FILENAME = 'pmp-account-payload';

export function RawPayloadRow({ bytes }: { bytes: Uint8Array }) {
    return (
        <FullWidthRow data-testid="pmp-account-raw">
            <RawDataField data={bytes} filename={PMP_PAYLOAD_DOWNLOAD_FILENAME} />
        </FullWidthRow>
    );
}
