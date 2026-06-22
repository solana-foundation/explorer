/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { ProgramSecurityTXTBadge } from '../SecurityTXTBadge';
import { createPmpSecurityTxt } from './helpers';

const mocks = vi.hoisted(() => ({ useSecurityTxt: vi.fn() }));
vi.mock('../../model/useSecurityTxt', () => ({ useSecurityTxt: mocks.useSecurityTxt }));
// `useClusterPath` (in the badge) reads the cluster context; stub the provider.
vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: Cluster.MainnetBeta, url: '' })),
}));

const mockPubkey = new PublicKey('ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S');

describe('ProgramSecurityTXTBadge', () => {
    afterEach(() => vi.clearAllMocks());

    it('should show "no security.txt" when none is present', () => {
        mocks.useSecurityTxt.mockReturnValue({ isLoading: false, securityTxt: undefined });
        render(<ProgramSecurityTXTBadge programPubkey={mockPubkey} />);
        expect(screen.getByText(/Program has no security\.txt/i)).toBeInTheDocument();
    });

    it('should show the Included badge when a security.txt is present', () => {
        mocks.useSecurityTxt.mockReturnValue({ isLoading: false, securityTxt: createPmpSecurityTxt() });
        render(<ProgramSecurityTXTBadge programPubkey={mockPubkey} />);
        expect(screen.getByText(/Included/i)).toBeInTheDocument();
    });

    it('should render nothing while loading', () => {
        mocks.useSecurityTxt.mockReturnValue({ isLoading: true, securityTxt: undefined });
        const { container } = render(<ProgramSecurityTXTBadge programPubkey={mockPubkey} />);
        expect(container).toBeEmptyDOMElement();
    });
});
