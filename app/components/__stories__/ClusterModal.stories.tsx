import { useClusterModal } from '@providers/cluster';
import { nextjsParameters, withClusterModalOpen } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { createStore, Provider as JotaiProvider } from 'jotai';
import React from 'react';

import { ClusterModal } from '../ClusterModal';

// Wraps the modal with a re-open button so the story stays interactive after the modal is dismissed.
function ClusterModalWithReopen() {
    const [, setShow] = useClusterModal();
    return (
        <>
            <button type="button" onClick={() => setShow(true)}>
                Open ClusterModal
            </button>
            <ClusterModal />
        </>
    );
}

// ClusterModal reads `useClusterModal` to decide visibility — the `withClusterModalOpen` decorator
// (see .storybook/decorators.tsx) seeds the cluster-modal atom to `true` so the modal renders.
// A fresh jotai store per story keeps that (and savedClusters) state isolated.
// Docs canvas height uses ipad portrait so the full modal fits without scrolling.
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
    parameters: {
        ...nextjsParameters,
        docs: { story: { height: INITIAL_VIEWPORTS.ipad.styles.height } },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/ClusterModal',
} satisfies Meta<typeof ClusterModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <ClusterModalWithReopen />,
};
