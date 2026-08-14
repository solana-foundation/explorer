import { PMP_ACCOUNT_HEADER_LEN, PMP_ADDRESS } from './constants';
import type { PmpAccountSnapshot, PmpAccountValidateResult } from './types';

export function validatePmpAccountBytes({ account }: { account: PmpAccountSnapshot }): PmpAccountValidateResult {
    const { data, lamports, owner } = account;

    // The accounts provider models "no such account" as zero lamports plus an empty raw buffer, which is also what
    // a closed PMP buffer leaves behind. No account can hold data at zero lamports, so this is unambiguous.
    if (lamports === 0 && (data === undefined || data.length === 0)) return { kind: 'absent' };

    if (owner !== PMP_ADDRESS) {
        return { kind: 'unreadable', reason: `the account is owned by ${owner}, not the Program Metadata Program` };
    }

    // Checked separately from the length below, so a live account fetched in a mode that stores no bytes is not
    // reported as a truncated one.
    if (data === undefined) {
        return { kind: 'unreadable', reason: 'the account was fetched without its data' };
    }

    if (data.length < PMP_ACCOUNT_HEADER_LEN) {
        return { kind: 'unreadable', reason: `the account is shorter than the ${PMP_ACCOUNT_HEADER_LEN}-byte header` };
    }

    return { data, kind: 'ok' };
}
