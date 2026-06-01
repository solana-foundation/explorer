import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { EVerificationSource, type VerificationSource } from '../../lib/types';
import { ERiskLevel } from '../../model/use-rugcheck';
import { TokenVerificationButton } from '../TokenVerificationButton';

const jupiterVerified: VerificationSource = {
    name: EVerificationSource.Jupiter,
    url: 'https://jup.ag',
    verified: true,
};

const rugcheckGood: VerificationSource = {
    level: ERiskLevel.Good,
    name: EVerificationSource.RugCheck,
    score: 90,
    url: 'https://rugcheck.xyz',
    verified: true,
};

const rugcheckWarning: VerificationSource = {
    level: ERiskLevel.Warning,
    name: EVerificationSource.RugCheck,
    score: 55,
    url: 'https://rugcheck.xyz',
    verified: true,
};

const meta: Meta<typeof TokenVerificationButton> = {
    args: { isOpen: false, onClick: fn() },
    component: TokenVerificationButton,
    tags: ['autodocs'],
    title: 'Features/TokenVerificationBadge/TokenVerificationButton',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NotVerified: Story = {
    args: { verificationFoundSources: [] },
};

export const VerifiedSingleSource: Story = {
    args: { verificationFoundSources: [jupiterVerified] },
};

export const VerifiedMultipleSources: Story = {
    args: { verificationFoundSources: [jupiterVerified, rugcheckGood] },
};

export const RugCheckWarning: Story = {
    args: { verificationFoundSources: [rugcheckWarning] },
};

export const Loading: Story = {
    args: { isLoading: true, verificationFoundSources: [] },
};

export const Open: Story = {
    args: { isOpen: true, verificationFoundSources: [jupiterVerified] },
};
