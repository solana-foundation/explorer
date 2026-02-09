import type { Meta, StoryObj } from '@storybook/react';

import { CookieCard, PrivacyPolicyLink } from './CookieConsent';

const meta = {
    component: CookieCard,
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    title: 'Features/Cookie/CookieConsent',
} satisfies Meta<typeof CookieCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EUBanner: Story = {
    args: {
        children: (
            <div className="e-flex e-flex-col e-gap-4">
                <p className="e-m-0 e-text-base e-leading-relaxed e-text-white">
                    This website uses cookies to offer you a better browsing experience. Find out more on{' '}
                    <PrivacyPolicyLink>how we use cookies</PrivacyPolicyLink>.
                </p>

                <div className="e-flex e-flex-row e-items-center e-justify-end e-gap-4">
                    <button
                        className="e-cursor-pointer e-border-none e-bg-transparent e-p-0 e-text-sm e-font-medium e-tracking-wider e-text-white e-transition-opacity hover:e-opacity-70"
                        onClick={() => alert('Opted out')}
                    >
                        OPT-OUT
                    </button>
                    <button className="btn btn-white e-bg-transparent" onClick={() => alert('Accepted')}>
                        ACCEPT
                    </button>
                </div>
            </div>
        ),
    },
};

export const CardOnly: Story = {
    args: {
        children: (
            <p className="e-m-0 e-text-base e-text-white">Cookie consent card container with customizable content.</p>
        ),
    },
};
