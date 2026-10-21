'use client';

import { type ComponentType, useState } from 'react';
import { ArrowUpRight, GitHub, MessageCircle } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { cn } from '@/app/components/shared/utils';

import type { FeedbackFormValues } from '../model/use-feedback-form';
import { BugIcon, GlowingBulbIcon, type IconProps } from './feedback-icons';
import { FeedbackForm } from './FeedbackForm';

export interface FeedbackTopicsProps {
    showForm: boolean;
    ideasUrl: string;
    bugReportUrl: string;
    isSubmitting: boolean;
    error: boolean;
    onSubmit: (values: FeedbackFormValues) => void;
    onNavigateAway: () => void;
}

interface Topic {
    id: 'feedback' | 'idea' | 'bug';
    title: string;
    Icon: ComponentType<IconProps>;
    href?: string;
}

const GITHUB_COPY = {
    bug: {
        button: 'Report a bug on GitHub',
        heading: 'Report a bug',
        note: 'Bugs are tracked as GitHub issues, with a template for the details.',
    },
    idea: {
        button: 'Suggest an idea on GitHub',
        heading: 'Suggest an idea',
        note: 'Ideas are collected as GitHub issues, where others can upvote them.',
    },
} as const;

export function FeedbackTopics({
    showForm,
    ideasUrl,
    bugReportUrl,
    isSubmitting,
    error,
    onSubmit,
    onNavigateAway,
}: FeedbackTopicsProps) {
    const topics: Topic[] = [
        ...(showForm ? [{ Icon: MessageCircle, id: 'feedback' as const, title: 'Your thoughts' }] : []),
        { Icon: GlowingBulbIcon, href: ideasUrl, id: 'idea', title: 'Idea' },
        { Icon: BugIcon, href: bugReportUrl, id: 'bug', title: 'Bug' },
    ];
    const [selectedId, setSelectedId] = useState(topics[0].id);
    const selected = topics.find(topic => topic.id === selectedId) ?? topics[0];

    return (
        <div className="flex flex-col gap-6">
            <div aria-label="Topic" className="flex flex-wrap gap-1" role="group">
                {topics.map(topic => {
                    const isSelected = topic.id === selected.id;
                    return (
                        <Button
                            key={topic.id}
                            aria-pressed={isSelected}
                            className={cn(
                                'cursor-pointer !gap-1.5 !px-2.5 !text-sm sm:!px-3 [&_svg]:!size-4',
                                isSelected && '!border-accent',
                            )}
                            onClick={() => setSelectedId(topic.id)}
                            variant={isSelected ? 'default' : 'outline'}
                        >
                            <topic.Icon size={16} />
                            {topic.title}
                        </Button>
                    );
                })}
            </div>
            {showForm && (
                <div className={cn(selected.id !== 'feedback' && 'hidden')}>
                    <FeedbackForm error={error} isSubmitting={isSubmitting} onSubmit={onSubmit} />
                </div>
            )}
            {selected.id !== 'feedback' && <GitHubTopic onNavigateAway={onNavigateAway} topic={selected} />}
        </div>
    );
}

function GitHubTopic({ topic, onNavigateAway }: { topic: Topic; onNavigateAway: () => void }) {
    if (topic.id === 'feedback' || !topic.href) return undefined;
    const copy = GITHUB_COPY[topic.id];
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium leading-none text-neutral-200">{copy.heading}</span>
                <p className="m-0 text-sm leading-snug text-outer-space-300">{copy.note}</p>
            </div>
            <Button asChild className="self-start !no-underline" size="lg" variant="outline">
                <ExternalLink href={topic.href} onClick={onNavigateAway}>
                    <GitHub />
                    {copy.button}
                    <ArrowUpRight />
                </ExternalLink>
            </Button>
        </div>
    );
}
