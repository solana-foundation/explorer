import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VerifiedBuildPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@/app/components/account/VerifiedBuildCard', () => ({
    VerifiedBuildCard: () => <div data-testid="verified-build-card" />,
}));

describe('VerifiedBuildPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
    });

    it('should render the verified build card for an upgradeable program account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'bpf-upgradeable-loader' } }, pubkey: 'x' };
        render(<VerifiedBuildPageClient params={{ address: 'addr' }} />);
        expect(screen.getByTestId('verified-build-card')).toBeInTheDocument();
        expect(mock.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not an upgradeable program account', () => {
        mock.account = { data: { parsed: { parsed: {}, program: 'vote' } }, pubkey: 'x' };
        render(<VerifiedBuildPageClient params={{ address: 'addr' }} />);
        expect(screen.queryByTestId('verified-build-card')).not.toBeInTheDocument();
        expect(mock.onNotFound).toHaveBeenCalledOnce();
    });
});
