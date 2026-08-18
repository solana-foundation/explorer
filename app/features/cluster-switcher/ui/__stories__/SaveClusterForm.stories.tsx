import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { SaveClusterForm } from '../SaveClusterForm';
import { withSavedClusters, withSwitcherPanel } from './switcher-panel';

const CUSTOM_URL = 'https://my-node.example/rpc';

// The form renders only under the custom endpoint field on the Custom cluster, so none of its states are
// reachable from a story of the modal on its default cluster.
const meta = {
    component: SaveClusterForm,
    decorators: [withSavedClusters([]), withSwitcherPanel],
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/SaveClusterForm',
} satisfies Meta<typeof SaveClusterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Closed: one button, and no opinion yet about the URL in the field.
export const Collapsed: Story = {
    args: { savedClusters: [], url: CUSTOM_URL },
};

// Opened, with the host already filled in. The path and query — where providers put the API key — stay
// out of the name.
export const Naming: Story = {
    args: { savedClusters: [], url: CUSTOM_URL },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('save-custom-cluster-btn'));

        expect(canvas.getByTestId('cluster-name-input')).toHaveValue('my-node.example');
        expect(canvas.queryByTestId('name-required-hint')).not.toBeInTheDocument();
        expect(canvas.getByTestId('confirm-save-cluster-btn')).toBeEnabled();
    },
};

// The suggestion is a starting point, not the name. Cleared, the form is back to requiring one.
export const NameCleared: Story = {
    args: { savedClusters: [], url: CUSTOM_URL },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('save-custom-cluster-btn'));
        await userEvent.clear(canvas.getByTestId('cluster-name-input'));

        expect(canvas.getByTestId('name-required-hint')).toBeInTheDocument();
        expect(canvas.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    },
};

// Named by hand, over the suggestion.
export const Named: Story = {
    args: { savedClusters: [], url: CUSTOM_URL },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('save-custom-cluster-btn'));
        await userEvent.clear(canvas.getByTestId('cluster-name-input'));
        await userEvent.type(canvas.getByTestId('cluster-name-input'), 'My Node');

        expect(canvas.getByTestId('cluster-name-input')).toHaveValue('My Node');
        expect(canvas.getByTestId('confirm-save-cluster-btn')).toBeEnabled();
    },
};

// Refused here rather than stored: an entry the reader will not accept renders a pill that goes nowhere,
// so the click reads as dead rather than as rejected.
export const InvalidUrl: Story = {
    args: { savedClusters: [], url: 'my-node.example' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('save-custom-cluster-btn'));
        await userEvent.type(canvas.getByTestId('cluster-name-input'), 'My Node');
        await userEvent.click(canvas.getByTestId('confirm-save-cluster-btn'));

        expect(canvas.getByTestId('save-cluster-error')).toHaveTextContent('valid URL');
        // Still open, with the name kept, so the fix is one edit of the field away.
        expect(canvas.getByTestId('cluster-name-input')).toHaveValue('My Node');
    },
};
