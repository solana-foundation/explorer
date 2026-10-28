/* eslint-disable no-restricted-syntax -- test normalizes rendered hex whitespace via RegExp */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { InstructionEvent } from '../model/events';
import { EventRows } from '../ui/EventRows';

const DECODED: InstructionEvent = {
    args: [{ kind: 'leaf', name: 'Amount', type: 'u64', value: { kind: 'text', value: '42' } }],
    data: new Uint8Array([0xab, 0xcd]),
    kind: 'decoded',
    name: 'Sample Event',
};
const UNKNOWN: InstructionEvent = { data: new Uint8Array([0x09, 0x09]), kind: 'unknown' };

describe('EventRows', () => {
    it('should number each event by the position of its instruction', () => {
        renderRows({ events: [DECODED, UNKNOWN], position: { childIndex: 2, index: 1 }, showRaw: false });

        expect(screen.getByText('#2.3 · event 1')).toBeInTheDocument();
        expect(screen.getByText('#2.3 · event 2')).toBeInTheDocument();
    });

    it('should show the fields of a decoded event', () => {
        renderRows({ events: [DECODED], position: { index: 0 }, showRaw: false });

        expect(screen.getByText('Sample Event')).toBeInTheDocument();
        expect(screen.getByText('Field Name')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.queryByText('Event Data')).not.toBeInTheDocument();
    });

    it('should show the bytes of a decoded event in the Raw view', () => {
        renderRows({ events: [DECODED], position: { index: 0 }, showRaw: true });

        expect(screen.getByText('Sample Event')).toBeInTheDocument();
        expect(screen.getByText('Event Data')).toBeInTheDocument();
        expect(renderedHex()).toContain('abcd');
        expect(screen.queryByText('Field Name')).not.toBeInTheDocument();
    });

    it('should show the bytes of an event the IDL cannot decode', () => {
        renderRows({ events: [UNKNOWN], position: { index: 0 }, showRaw: false });

        expect(screen.getByText('Unknown Event')).toBeInTheDocument();
        expect(renderedHex()).toContain('0909');
    });
});

function renderRows(props: React.ComponentProps<typeof EventRows>) {
    return render(
        <table>
            <tbody>
                <EventRows {...props} />
            </tbody>
        </table>,
    );
}

function renderedHex(): string {
    return (document.body.textContent ?? '').replace(/\s/g, '').toLowerCase();
}
