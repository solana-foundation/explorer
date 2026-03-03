import type { Decorator } from '@storybook/react';
import { fn } from 'storybook/test';

export const withClipboardMock: Decorator = Story => {
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: fn().mockResolvedValue(undefined) },
    });

    return <Story />;
};
