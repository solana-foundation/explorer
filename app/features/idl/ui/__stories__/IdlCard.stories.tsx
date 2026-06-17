import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClipboardMock, withCluster } from '@storybook-config/decorators';

import { IdlCard } from '../IdlCard';

// The IDL hooks (useAnchorProgram, useProgramMetadataIdl, useProgramMetadataCodamaIdl) fetch
// over RPC. In Storybook without network they resolve to no-IDL and the card renders its
// empty state (upload instructions). Stories that exercise the IDL tabs are covered separately
// by the formatted-idl/* and entities/idl/* component stories.
const meta = {
    component: IdlCard,
    decorators: [withCluster, withClipboardMock],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/IdlCard',
} satisfies Meta<typeof IdlCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoIdl: Story = {
    args: {
        programId: '11111111111111111111111111111111',
    },
};
