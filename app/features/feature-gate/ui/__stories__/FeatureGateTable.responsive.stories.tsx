import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import type { ActivatedFeature } from '../../lib/partition-features';
import { FeatureGateTable } from '../FeatureGateTable';
import * as Base from './FeatureGateTable.stories';

const meta: Meta<typeof FeatureGateTable<ActivatedFeature>> = {
    component: FeatureGateTable<ActivatedFeature>,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/FeatureGateTable@Media',
};

export default meta;
type Story = StoryObj<typeof FeatureGateTable<ActivatedFeature>>;

const args = Base.ActivatedRows.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
