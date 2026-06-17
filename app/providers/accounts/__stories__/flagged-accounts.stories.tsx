import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters } from '@storybook-config/decorators';

import FLAGGED_ACCOUNTS_WARNING from '../flagged-accounts';

// Each story renders one of the three unique IncidentDescription JSX entries from FLAGGED_ACCOUNTS_WARNING.
// The map keys (account addresses) are stable; addresses below were picked one per incident type.
const meta = {
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Providers/Accounts/FlaggedAccountWarnings',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FtxHackNovember2022: Story = {
    render: () => FLAGGED_ACCOUNTS_WARNING['22Y43yTVxuUkoRKdm9thyRhQ3SdgQS7c7kB6UNCiaczD'],
};

export const HackDecember2024: Story = {
    render: () => FLAGGED_ACCOUNTS_WARNING['5vDufDG5qxD49SXnw72afB1c6ykUGaa6T5dE9yE9xMMs'],
};

export const KnownScam: Story = {
    render: () => FLAGGED_ACCOUNTS_WARNING['9tAViia54YAaL9gv92hBu8K4QGRBKbytCQ9TYsJ6F6or'],
};
