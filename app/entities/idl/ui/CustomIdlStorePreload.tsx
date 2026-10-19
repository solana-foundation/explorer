'use client';

import { useAtomValue } from 'jotai';

import { customIdlStoreAtom } from '../model/custom-idl/custom-idl-store';

// The store reads the storage when its first reader mounts. A page mounts this reader early, so the read starts
// before its instruction cards mount.
export function CustomIdlStorePreload() {
    useAtomValue(customIdlStoreAtom);
    // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
    return null;
}
