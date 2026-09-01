import { describe, expect, it } from 'vitest';

import { decodeLoaderV4State, loaderV4ProgramBytes } from '../loader-v4-state.js';
import { loaderV4StateBytes } from './account-fixtures.js';

const AUTHORITY = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';

describe('decodeLoaderV4State', () => {
    it('should decode slot, authority and status from a deployed state header', () => {
        const bytes = loaderV4StateBytes({ authority: AUTHORITY, slot: 395847597, status: 'deployed' });

        const [error, state] = decodeLoaderV4State(bytes);

        expect(error).toBeUndefined();
        expect(state).toEqual({ authority: AUTHORITY, slot: 395847597n, status: 'deployed' });
    });

    it('should decode a header-only account with a zero-length program', () => {
        const bytes = loaderV4StateBytes({ authority: AUTHORITY, elf: new Uint8Array(0), status: 'retracted' });

        const [error, state] = decodeLoaderV4State(bytes);

        expect(loaderV4ProgramBytes(bytes).length).toBe(0);
        expect(error).toBeUndefined();
        expect(state?.status).toBe('retracted');
    });

    it.each(['retracted', 'finalized'] as const)('should decode the %s status', status => {
        const [error, state] = decodeLoaderV4State(loaderV4StateBytes({ authority: AUTHORITY, status }));

        expect(error).toBeUndefined();
        expect(state?.status).toBe(status);
    });

    it('should error on data shorter than the state header', () => {
        const [error, state] = decodeLoaderV4State(new Uint8Array(47));

        expect(error).toBeInstanceOf(Error);
        expect(state).toBeUndefined();
    });

    it('should error on null input', () => {
        const [error, state] = decodeLoaderV4State(null);

        expect(error).toBeInstanceOf(Error);
        expect(state).toBeUndefined();
    });

    it('should error on unknown status values', () => {
        const bytes = loaderV4StateBytes({ authority: AUTHORITY, status: 'deployed' });
        new DataView(bytes.buffer).setBigUint64(40, 7n, true);

        const [error, state] = decodeLoaderV4State(bytes);

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toContain('unknown loader-v4 status');
        expect(state).toBeUndefined();
    });
});
