import { parsedAccount } from '@components/account/__mocks__/ParsedAccountRenderer';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AddressLookupTableEntriesPageClient from '../page-client';

const mockIsAlt = vi.hoisted(() => vi.fn((): boolean => false));

vi.mock('@components/account/ParsedAccountRenderer');
vi.mock('@components/account/address-lookup-table/LookupTableEntriesCard', () => ({
    LookupTableEntriesCard: () => <div data-testid="lookup-table-entries-card" />,
}));
vi.mock('@components/account/address-lookup-table/types', () => ({ isAddressLookupTableAccount: mockIsAlt }));

describe('AddressLookupTableEntriesPageClient', () => {
    beforeEach(() => {
        mockIsAlt.mockReturnValue(false);
    });

    it('should render the lookup table entries card for a parsed lookup table account', () => {
        parsedAccount.account = {
            data: { parsed: { parsed: { info: {}, type: 'lookupTable' }, program: 'address-lookup-table' } },
        };
        render(<AddressLookupTableEntriesPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('lookup-table-entries-card')).toBeInTheDocument();
        expect(parsedAccount.onNotFound).not.toHaveBeenCalled();
    });

    it('should render the entries card from raw data when the account is a raw lookup table', () => {
        mockIsAlt.mockReturnValue(true);
        parsedAccount.account = { data: { raw: new Uint8Array([1, 2, 3]) }, owner: { toBase58: () => 'ALTowner' } };
        render(<AddressLookupTableEntriesPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('lookup-table-entries-card')).toBeInTheDocument();
        expect(mockIsAlt).toHaveBeenCalledWith('ALTowner', expect.any(Uint8Array));
        expect(parsedAccount.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when neither the parsed nor raw account is a lookup table', () => {
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'vote' } }, owner: { toBase58: () => 'x' } };
        render(<AddressLookupTableEntriesPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('lookup-table-entries-card')).not.toBeInTheDocument();
        expect(parsedAccount.onNotFound).toHaveBeenCalledOnce();
    });
});
