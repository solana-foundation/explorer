import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SecurityPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@/app/components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@/app/features/security-txt/ui/SecurityCard', () => ({
    SecurityCard: () => <div data-testid="security-card" />,
}));

describe('SecurityPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the security card for an upgradeable program account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'bpf-upgradeable-loader' } }, pubkey: 'x' };
        render(<SecurityPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('security-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not an upgradeable program account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } }, pubkey: 'x' };
        render(<SecurityPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('security-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
