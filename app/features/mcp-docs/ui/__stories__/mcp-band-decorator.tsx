import type { Decorator } from '@storybook-config/types';

export const withMcpBand: Decorator = Story => (
    <div className="max-w-4xl bg-heavy-metal-950 p-6 text-dark-foreground">
        <Story />
    </div>
);
