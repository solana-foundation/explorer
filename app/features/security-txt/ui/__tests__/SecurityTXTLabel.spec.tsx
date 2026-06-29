import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NEODYME_SECURITY_TXT_DOC_LINK, PMP_SECURITY_TXT_DOC_LINK } from '../../lib/constants';
import { ProgramSecurityTXTLabel } from '../SecurityTXTLabel';
import { createPmpSecurityTxt } from './helpers';

const mocks = vi.hoisted(() => ({ useSecurityTxt: vi.fn() }));
vi.mock('../../model/useSecurityTxt', () => ({ useSecurityTxt: mocks.useSecurityTxt }));

const mockPubkey = new PublicKey('ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S');

describe('ProgramSecurityTXTLabel', () => {
    afterEach(() => vi.clearAllMocks());

    it('should link to the Neodyme doc by default', () => {
        mocks.useSecurityTxt.mockReturnValue({ isLoading: false, securityTxt: undefined });
        render(<ProgramSecurityTXTLabel programPubkey={mockPubkey} />);
        expect(screen.getByRole('link')).toHaveAttribute('href', NEODYME_SECURITY_TXT_DOC_LINK);
    });

    it('should link to the Program Metadata doc when PMP is the source', () => {
        mocks.useSecurityTxt.mockReturnValue({ isLoading: false, securityTxt: createPmpSecurityTxt() });
        render(<ProgramSecurityTXTLabel programPubkey={mockPubkey} />);
        expect(screen.getByRole('link')).toHaveAttribute('href', PMP_SECURITY_TXT_DOC_LINK);
    });
});
