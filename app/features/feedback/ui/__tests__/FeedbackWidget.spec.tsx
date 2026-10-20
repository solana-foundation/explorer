import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getDefaultStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendFeedback } from '@/app/shared/lib/sentry/client';

import { feedbackOpenAtom } from '../../model/feedback';
import { FeedbackTrigger } from '../FeedbackTrigger';
import { FeedbackWidget } from '../FeedbackWidget';

vi.mock('@entities/cluster', () => ({
    clusterSlug: () => 'mainnet-beta',
    useCluster: () => ({ cluster: 0 }),
}));

const SENTRY_DSN_FIXTURE = 'https://examplePublicKey@o0.ingest.sentry.io/0';

describe('FeedbackWidget', () => {
    beforeEach(() => {
        // The popup's open state is a shared atom; each test starts closed.
        getDefaultStore().set(feedbackOpenAtom, false);
        vi.mocked(sendFeedback).mockClear();
        vi.mocked(sendFeedback).mockResolvedValue('test-event-id');
        vi.stubEnv('NEXT_PUBLIC_FEEDBACK_ENABLED', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should render nothing when the feature flag is off', () => {
        vi.stubEnv('NEXT_PUBLIC_FEEDBACK_ENABLED', 'false');
        render(<FeedbackWidget />);

        expect(screen.queryByRole('button', { name: 'Feedback' })).toBeNull();
    });

    it('should open the popup on the feedback form', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(<FeedbackWidget />);
        await openPopup();

        expect(screen.getByRole('button', { name: 'Your thoughts' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('textbox', { name: 'Feedback' })).toBeInTheDocument();
    });

    it('should link each GitHub topic to its issue template', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(<FeedbackWidget />);
        await openPopup();

        await userEvent.click(screen.getByRole('button', { name: 'Idea' }));
        expect(screen.getByRole('link', { name: 'Suggest an idea on GitHub' })).toHaveAttribute(
            'href',
            'https://github.com/solana-foundation/explorer/issues/new?template=feature_request.yml',
        );

        await userEvent.click(screen.getByRole('button', { name: 'Bug' }));
        expect(screen.getByRole('link', { name: 'Report a bug on GitHub' })).toHaveAttribute(
            'href',
            'https://github.com/solana-foundation/explorer/issues/new?template=bug_report.yml',
        );
    });

    it('should offer only the GitHub topics when client Sentry is disabled', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
        render(<FeedbackWidget />);
        await openPopup();

        expect(screen.queryByRole('button', { name: 'Your thoughts' })).toBeNull();
        expect(screen.queryByRole('textbox', { name: 'Feedback' })).toBeNull();
        expect(screen.getByRole('link', { name: 'Suggest an idea on GitHub' })).toBeInTheDocument();
    });

    it('should submit message, rating, contact, cluster, and source and show the sent note', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(<FeedbackWidget />);
        await openPopup();

        await userEvent.click(screen.getByRole('radio', { name: '4 of 5 stars' }));
        await userEvent.type(screen.getByRole('textbox', { name: 'Feedback' }), 'Great explorer!');
        await userEvent.type(screen.getByRole('textbox', { name: 'X handle (optional)' }), '@fren');
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(sendFeedback).toHaveBeenCalledWith({
            message: 'Great explorer!',
            name: '@fren',
            source: 'widget',
            tags: { cluster: 'mainnet-beta', rating: 4, source: 'widget', type: 'feedback' },
        });
        expect(await screen.findByText('Feedback sent!')).toBeInTheDocument();
    });

    it('should show the send in progress on the Submit button', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        let deliver: (id: string) => void = () => undefined;
        vi.mocked(sendFeedback).mockReturnValueOnce(new Promise(resolve => (deliver = resolve)));
        render(<FeedbackWidget />);
        await openPopup();

        await userEvent.type(screen.getByRole('textbox', { name: 'Feedback' }), 'In flight');
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(await screen.findByRole('button', { name: 'Sending…' })).toBeDisabled();
        // A second press while it sends does not send again.
        await userEvent.click(screen.getByRole('button', { name: 'Sending…' }));
        expect(sendFeedback).toHaveBeenCalledOnce();
        deliver('test-event-id');
        expect(await screen.findByText('Feedback sent!')).toBeInTheDocument();
    });

    it('should keep the form open and write the error when delivery fails', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        vi.mocked(sendFeedback).mockRejectedValueOnce('Unable to send feedback.');
        render(<FeedbackWidget />);
        await openPopup();

        await userEvent.type(screen.getByRole('textbox', { name: 'Feedback' }), 'Lost feedback');
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Could not send feedback. Try again.');
        expect(screen.getByRole('textbox', { name: 'Feedback' })).toHaveValue('Lost feedback');
    });

    it('should close the popup without sending when the close button is clicked', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(<FeedbackWidget />);
        await openPopup();

        await userEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(sendFeedback).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('should close itself a short while after showing the sent note', async () => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(<FeedbackWidget />);
        await openPopup(user);

        await user.type(screen.getByRole('textbox', { name: 'Feedback' }), 'Great explorer!');
        await user.click(screen.getByRole('button', { name: 'Submit' }));
        expect(await screen.findByText('Feedback sent!')).toBeInTheDocument();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2500);
        });
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

        vi.useRealTimers();
    });

    it('should reset the topic and rating when the popup is reopened', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(<FeedbackWidget />);
        await openPopup();

        await userEvent.click(screen.getByRole('radio', { name: '4 of 5 stars' }));
        await userEvent.click(screen.getByRole('button', { name: 'Idea' }));
        expect(screen.getByRole('button', { name: 'Idea' })).toHaveAttribute('aria-pressed', 'true');

        await userEvent.click(screen.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

        await openPopup();
        expect(screen.getByRole('button', { name: 'Your thoughts' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('radio', { name: '4 of 5 stars' })).not.toBeChecked();
    });

    it('should open the same popup from an inline trigger, such as the footer link', async () => {
        vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', SENTRY_DSN_FIXTURE);
        render(
            <>
                <FeedbackTrigger>Footer feedback</FeedbackTrigger>
                <FeedbackWidget />
            </>,
        );
        // The widget's panel loads lazily; wait for it before asking it to open.
        await screen.findByRole('button', { name: 'Feedback' });

        await userEvent.click(screen.getByRole('button', { name: 'Footer feedback' }));

        expect(await screen.findByRole('dialog', { name: 'Feedback' })).toBeInTheDocument();
    });
});

async function openPopup(user: Pick<typeof userEvent, 'click'> = userEvent) {
    await user.click(await screen.findByRole('button', { name: 'Feedback' }));
    await screen.findByRole('dialog', { name: 'Feedback' });
}
