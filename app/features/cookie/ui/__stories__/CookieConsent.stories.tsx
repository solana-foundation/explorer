import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@/app/components/shared/ui/button';

import { CookieCard, PrivacyPolicyLink } from '../CookieConsent';

const meta = {
    component: CookieCard,
    parameters: {
        // CookieCard is position:fixed, so inline it escapes the docs flow and the
        // preview block collapses. Render each story in its own sized iframe so the
        // card is contained and visible in full per block.
        docs: { story: { height: '220px', inline: false } },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Cookie/CookieConsent',
} satisfies Meta<typeof CookieCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EUBanner: Story = {
    args: {
        children: (
            <div className="flex flex-col gap-4">
                <p className="m-0 text-base leading-relaxed text-white">
                    This website uses cookies to offer you a better browsing experience. Find out more on{' '}
                    <PrivacyPolicyLink>how we use cookies</PrivacyPolicyLink>.
                </p>

                <div className="flex flex-row items-center justify-end gap-4">
                    <button
                        className="cursor-pointer border-none bg-transparent p-0 text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-70"
                        onClick={() => alert('Opted out')}
                    >
                        OPT-OUT
                    </button>
                    <Button ui="dashkit" variant="white" className="bg-transparent" onClick={() => alert('Accepted')}>
                        ACCEPT
                    </Button>
                </div>
            </div>
        ),
    },
};

export const CardOnly: Story = {
    args: {
        children: <p className="m-0 text-base text-white">Cookie consent card container with customizable content.</p>,
    },
};
