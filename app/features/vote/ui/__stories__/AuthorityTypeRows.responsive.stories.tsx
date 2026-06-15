import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCardTableField } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { AuthorityTypeRows } from '../instructions/AuthorityTypeRows';

const meta = {
    component: AuthorityTypeRows,
    decorators: [withViewportFromGlobal, withCardTableField],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/AuthorityTypeRows/Responsive',
} satisfies Meta<typeof AuthorityTypeRows>;

export default meta;
type Story = StoryObj<typeof meta>;

// BLS variant is the widest payload — exercises base64-row wrapping at narrow widths.
const args = {
    authorityType: {
        VoterWithBLS: {
            bls_proof_of_possession: new Array(96).fill(7),
            bls_pubkey: new Array(48).fill(3),
        },
    },
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
