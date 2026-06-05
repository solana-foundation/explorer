import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterModalOpen } from '@storybook-config/decorators';
import { createStore, Provider as JotaiProvider } from 'jotai';
import React from 'react';

import { ClusterModal } from '../ClusterModal';

// ClusterModal reads `useClusterModal` to decide visibility — the `withClusterModalOpen` decorator
// (see .storybook/decorators.tsx) seeds the ModalContext with `[true, setShow]` so the modal renders.
// A fresh jotai store per story keeps savedClusters state isolated.
const meta = {
    component: ClusterModal,
    decorators: [
        Story => (
            <JotaiProvider store={createStore()}>
                <Story />
            </JotaiProvider>
        ),
        withClusterModalOpen,
    ],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/ClusterModal',
} satisfies Meta<typeof ClusterModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
