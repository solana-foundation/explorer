'use client';

import { Copyable } from '@components/common/Copyable';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { toBase64 } from '@/app/shared/lib/bytes';

export type BaseTransactionRawDataProps = {
    signature: string;
    // undefined until the raw transaction has been fetched (lazily, on hover).
    data: Uint8Array | undefined;
    loading: boolean;
    onHover: () => void;
};

export function BaseTransactionRawData({ signature, data, loading, onHover }: BaseTransactionRawDataProps) {
    return (
        <div className="flex items-center gap-[3px]" onMouseEnter={onHover}>
            {/* Copyable's `text` is `string | null`; null is its "nothing to copy" sentinel (empty string would copy ""). */}
            {/* eslint-disable-next-line unicorn/no-null */}
            <Copyable text={data ? toBase64(data) : null}>
                <DownloadDropdown data={data} loading={loading} filename={signature} />
            </Copyable>
        </div>
    );
}
