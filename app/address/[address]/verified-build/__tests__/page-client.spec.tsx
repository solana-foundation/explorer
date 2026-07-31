import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VerifiedBuildPageClient from '../page-client';

const mock = vi.hoisted(() => ({ account: undefined as unknown, onNotFound: vi.fn() }));
const mockCard = vi.hoisted(() => vi.fn((_props: unknown) => <div data-testid="verified-build-card" />));

vi.mock('@components/account/ParsedAccountRenderer', () => ({
    ParsedAccountRenderer: ({ renderComponent: Render }: { renderComponent: React.ComponentType<any> }) => (
        <Render account={mock.account} onNotFound={mock.onNotFound} />
    ),
}));
vi.mock('@/app/components/account/VerifiedBuildCard', () => ({
    VerifiedBuildCard: mockCard,
}));

describe('VerifiedBuildPageClient', () => {
    beforeEach(() => {
        mock.onNotFound.mockClear();
        mock.account = undefined;
        mockCard.mockClear();
        mockCard.mockImplementation(() => <div data-testid="verified-build-card" />);
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

    it('should forward the parsed data and pubkey to the verified build card', () => {
        mock.account = {
            data: { parsed: { parsed: { foo: 1 }, program: 'bpf-upgradeable-loader' } },
            pubkey: 'PUBKEY',
        };
        render(<VerifiedBuildPageClient params={{ address: 'addr' }} />);
        expect(mockCard.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({
                data: expect.objectContaining({ program: 'bpf-upgradeable-loader' }),
                pubkey: 'PUBKEY',
            }),
        );
    });

    it('should render the error fallback when the verified build card throws', () => {
        mockCard.mockImplementation(() => {
            throw new Error('boom');
        });
        mock.account = { data: { parsed: { parsed: {}, program: 'bpf-upgradeable-loader' } }, pubkey: 'x' };
        render(<VerifiedBuildPageClient params={{ address: 'addr' }} />);
        expect(screen.getByText('Error loading verified build information')).toBeInTheDocument();
    });
});
