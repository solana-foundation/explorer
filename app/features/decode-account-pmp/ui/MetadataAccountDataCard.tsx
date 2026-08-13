'use client';

import { useDecodeMetadataPayload } from '../model/use-decode-metadata-payload';
import { BaseMetadataAccountCard, type MetadataAccountRead } from './BaseMetadataAccountCard';

export function MetadataAccountDataCard({ metadata }: { metadata: MetadataAccountRead }) {
    const decodedPayload = useDecodeMetadataPayload(metadata.account);
    return <BaseMetadataAccountCard payload={decodedPayload} metadata={metadata} />;
}
