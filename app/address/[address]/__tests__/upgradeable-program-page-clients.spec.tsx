import { parsedAccount } from '@components/account/__mocks__/ParsedAccountRenderer';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProgramMultisigPageClient from '../program-multisig/page-client';
import SecurityPageClient from '../security/page-client';
import VerifiedBuildPageClient from '../verified-build/page-client';

const mockVerifiedBuildCard = vi.hoisted(() => vi.fn((_props: unknown) => <div data-testid="verified-build-card" />));

vi.mock('@components/account/ParsedAccountRenderer');
vi.mock('@/app/components/account/ProgramMultisigCard', () => ({
    ProgramMultisigCard: () => <div data-testid="program-multisig-card" />,
}));
vi.mock('@/app/features/security-txt/ui/SecurityCard', () => ({
    SecurityCard: () => <div data-testid="security-card" />,
}));
vi.mock('@/app/components/account/VerifiedBuildCard', () => ({
    VerifiedBuildCard: mockVerifiedBuildCard,
}));

describe.each([
    { Page: ProgramMultisigPageClient, cardTestId: 'program-multisig-card' },
    { Page: SecurityPageClient, cardTestId: 'security-card' },
    { Page: VerifiedBuildPageClient, cardTestId: 'verified-build-card' },
])('$Page.name', ({ Page, cardTestId }) => {
    it('should render the card for an upgradeable program account', () => {
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'bpf-upgradeable-loader' } }, pubkey: 'x' };
        render(<Page params={{ address: 'addr' }} />);
        expect(screen.getByTestId(cardTestId)).toBeInTheDocument();
        expect(parsedAccount.onNotFound).not.toHaveBeenCalled();
    });

    it('should call onNotFound when the account is not an upgradeable program account', () => {
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'vote' } }, pubkey: 'x' };
        render(<Page params={{ address: 'addr' }} />);
        expect(screen.queryByTestId(cardTestId)).not.toBeInTheDocument();
        expect(parsedAccount.onNotFound).toHaveBeenCalledOnce();
    });
});

describe('VerifiedBuildPageClient', () => {
    beforeEach(() => {
        mockVerifiedBuildCard.mockClear();
        mockVerifiedBuildCard.mockImplementation(() => <div data-testid="verified-build-card" />);
    });

    it('should forward the parsed data and pubkey to the verified build card', () => {
        parsedAccount.account = {
            data: { parsed: { parsed: { foo: 1 }, program: 'bpf-upgradeable-loader' } },
            pubkey: 'PUBKEY',
        };
        render(<VerifiedBuildPageClient params={{ address: 'addr' }} />);
        expect(mockVerifiedBuildCard.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({
                data: expect.objectContaining({ program: 'bpf-upgradeable-loader' }),
                pubkey: 'PUBKEY',
            }),
        );
    });

    it('should render the error fallback when the verified build card throws', () => {
        mockVerifiedBuildCard.mockImplementation(() => {
            throw new Error('boom');
        });
        parsedAccount.account = { data: { parsed: { parsed: {}, program: 'bpf-upgradeable-loader' } }, pubkey: 'x' };
        render(<VerifiedBuildPageClient params={{ address: 'addr' }} />);
        expect(screen.getByText('Error loading verified build information')).toBeInTheDocument();
    });
});
