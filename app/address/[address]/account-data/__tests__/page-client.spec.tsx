import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    PMP_BUFFER_DISCRIMINATOR,
    PMP_METADATA_DISCRIMINATOR,
} from '@/app/entities/pmp-account/lib/account-discriminators';
import { PMP_ADDRESS } from '@/app/entities/pmp-account/lib/constants';

import AccountDataPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@/app/components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@features/decode-account-pmp', () => ({
    PmpAccountCard: () => <div data-testid="pmp-account-card" />,
}));

function ownedBy(owner: string, discriminator = PMP_METADATA_DISCRIMINATOR) {
    return { data: { raw: new Uint8Array([discriminator]) }, owner: { toBase58: () => owner } };
}

describe('AccountDataPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the PMP card for an account owned by the Program Metadata Program', () => {
        mock.account = ownedBy(PMP_ADDRESS);
        render(<AccountDataPageClient params={{ address: 'addr' }} />);

        expect(screen.getByTestId('pmp-account-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should render the card for a Buffer too', () => {
        mock.account = ownedBy(PMP_ADDRESS, PMP_BUFFER_DISCRIMINATOR);
        render(<AccountDataPageClient params={{ address: 'addr' }} />);

        expect(screen.getByTestId('pmp-account-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should redirect when the account is owned by another program', () => {
        mock.account = ownedBy('11111111111111111111111111111111');
        render(<AccountDataPageClient params={{ address: 'addr' }} />);

        expect(screen.queryByTestId('pmp-account-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });

    it('should redirect when the account does not exist', () => {
        render(<AccountDataPageClient params={{ address: 'addr' }} />);

        expect(screen.queryByTestId('pmp-account-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
