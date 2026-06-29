import { nextjsParameters, withClipboardMock, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { IdlCard } from '../IdlCard';

// The card resolves its IDLs through useProgramIdls, which fetches over RPC. In Storybook without
// network it resolves to no-IDL and the card renders its empty state (upload instructions). Stories
// that exercise the IDL tabs are covered separately by the formatted-idl/* and entities/idl/* stories.
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
