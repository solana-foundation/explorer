'use client';

import { useResolveBufferConfig } from '../model/use-resolve-buffer-config';
import { BaseBufferAccountCard, type BufferAccountRead } from './BaseBufferAccountCard';

export function BufferAccountDataCard({ address, buffer }: { address: string; buffer: BufferAccountRead }) {
    const { configFromBytes, configFromOnchain } = useResolveBufferConfig({ account: buffer.account, address });

    return (
        <BaseBufferAccountCard
            configFromBytes={configFromBytes}
            configFromOnchain={configFromOnchain}
            buffer={buffer}
        />
    );
}
