import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AddressLookupTableEntriesPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));
const mockIsAlt = vi.hoisted(() => vi.fn((): boolean => false));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@components/account/address-lookup-table/LookupTableEntriesCard', () => ({
    LookupTableEntriesCard: () => <div data-testid="lookup-table-entries-card" />,
}));
vi.mock('@components/account/address-lookup-table/types', () => ({ isAddressLookupTableAccount: mockIsAlt }));

describe('AddressLookupTableEntriesPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
        mockIsAlt.mockReturnValue(false);
    });

    it('should render the lookup table entries card for a parsed lookup table account', () => {
        mock.account = {
            data: { parsed: { parsed: { info: {}, type: 'lookupTable' }, program: 'address-lookup-table' } },
        };
        render(<AddressLookupTableEntriesPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('lookup-table-entries-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should render the entries card from raw data when the account is a raw lookup table', () => {
        mockIsAlt.mockReturnValue(true);
        mock.account = { data: { raw: new Uint8Array([1, 2, 3]) }, owner: { toBase58: () => 'ALTowner' } };
        render(<AddressLookupTableEntriesPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('lookup-table-entries-card')).toBeInTheDocument();
        expect(mockIsAlt).toHaveBeenCalledWith('ALTowner', expect.any(Uint8Array));
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when neither the parsed nor raw account is a lookup table', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } }, owner: { toBase58: () => 'x' } };
        render(<AddressLookupTableEntriesPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('lookup-table-entries-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
