'use client';

import { useDecodeBufferPayload } from '../model/use-decode-buffer-payload';
import { BaseBufferAccountCard, type BufferAccountRead } from './BaseBufferAccountCard';

export function BufferAccountDataCard({ address, buffer }: { address: string; buffer: BufferAccountRead }) {
    const { configFromBytes, configFromOnchain } = useDecodeBufferPayload({ account: buffer.account, address });

    return (
        <BaseBufferAccountCard
            configFromBytes={configFromBytes}
            configFromOnchain={configFromOnchain}
            buffer={buffer}
        />
    );
}
