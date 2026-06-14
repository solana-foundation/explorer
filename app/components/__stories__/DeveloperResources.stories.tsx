import type { Meta, StoryObj } from '@storybook/react';

import { DeveloperResources } from '../DeveloperResources';

const meta: Meta<typeof DeveloperResources> = {
    component: DeveloperResources,
    tags: ['autodocs', 'test'],
    title: 'Components/DeveloperResources',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Empty image src keeps the skeleton state — avoids flaky screenshot captures from external image loads.
export const Default: Story = {
    args: {
        resources: [
            {
                description: 'Get started in 5 minutes or less!',
                image: '',
                link: 'https://solana.com/docs/intro/installation',
                title: 'Setup Your Solana Environment',
            },
            {
                description: 'Hands-on guide to the core concepts for building on Solana',
                image: '',
                link: 'https://solana.com/docs/intro/quick-start',
                title: 'Quick Start Guide',
            },
            {
                description: '11 hours of video lessons on Solana Development',
                image: '',
                link: 'https://www.youtube.com/watch?v=amAq-WHAFs8',
                title: 'Solana Developer Bootcamp',
            },
            {
                description: 'A course designed for EVM developers to learn Solana',
                image: '',
                link: 'https://www.rareskills.io/solana-tutorial',
                title: '60 Days of Solana',
            },
        ],
    },
};
