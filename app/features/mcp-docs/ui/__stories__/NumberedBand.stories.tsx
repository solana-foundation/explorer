import type { Meta, StoryObj } from '@storybook-config/types';

import { SECTIONS } from '../../lib/mcp-docs-layout';
import { BandIntro, NumberedBand } from '../NumberedBand';

const meta: Meta<typeof NumberedBand> = {
    component: NumberedBand,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/NumberedBand',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="bg-heavy-metal-950 text-dark-foreground">
            <NumberedBand section={SECTIONS[0]} flushTop>
                <BandIntro title="Pick your client, paste one line">
                    Pick your tool, copy the config — snippets already point at this deployment. No API key needed.
                </BandIntro>
            </NumberedBand>
        </div>
    ),
};
