import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProgramMultisigPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@/app/components/account/ProgramMultisigCard', () => ({
    ProgramMultisigCard: () => <div data-testid="program-multisig-card" />,
}));

describe('ProgramMultisigPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the program multisig card for an upgradeable program account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'bpf-upgradeable-loader' } } };
        render(<ProgramMultisigPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('program-multisig-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not an upgradeable program account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } } };
        render(<ProgramMultisigPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('program-multisig-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
