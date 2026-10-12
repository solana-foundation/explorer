import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AccountRoleBadges } from '../AccountRoleBadges';

const ROLE_BADGES = ['Writable', 'Signer'];

describe('AccountRoleBadges', () => {
    it.each([
        { badges: [], isSigner: false, isWritable: false },
        { badges: ['Writable'], isSigner: false, isWritable: true },
        { badges: ['Signer'], isSigner: true, isWritable: false },
        { badges: ['Writable', 'Signer'], isSigner: true, isWritable: true },
    ])('should show the badges for writable=$isWritable, signer=$isSigner', ({ badges, isSigner, isWritable }) => {
        render(<AccountRoleBadges isWritable={isWritable} isSigner={isSigner} />);

        const shown = screen.queryAllByText(text => ROLE_BADGES.includes(text));
        expect(shown.map(badge => badge.textContent)).toEqual(badges);
    });
});
