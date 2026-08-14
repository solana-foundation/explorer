import { NoteRow } from '../BasePmpAccountDataCard';

/** An empty payload is a state rather than a fault, which is why this is the one note that is not a warning. */
export function PayloadEmptyRow() {
    return (
        <NoteRow testId="pmp-account-payload-empty" variant="default">
            The payload is empty.
        </NoteRow>
    );
}

export function PayloadUndecodableRow({ reason }: { reason: string }) {
    return (
        <NoteRow testId="pmp-account-payload-undecodable" variant="warning">
            Could not decode this payload: {reason}
        </NoteRow>
    );
}

/**
 * Past the decode budget, so there is no document. Whether the bytes are offered alongside is the CALLER's call,
 * because only the caller knows whether it is holding them.
 */
export function PayloadTooLargeRow({ budget, size }: { budget: number; size: number }) {
    return (
        <NoteRow testId="pmp-account-payload-too-large" variant="warning">
            Payload too large to render ({size} bytes, limit {budget}).
        </NoteRow>
    );
}

export function PayloadUnpackOverflowRow({ limit }: { limit: number }) {
    return (
        <NoteRow testId="pmp-account-payload-unpack-overflow" variant="warning">
            Payload expands past the {limit}-byte limit for unpacking.
        </NoteRow>
    );
}
