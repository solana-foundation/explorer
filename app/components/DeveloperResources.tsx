'use client';

import { useState } from 'react';

import { Card, CardBody } from '@/app/shared/ui/Card';

type Resource = {
    title: string;
    description: string;
    image: string;
    link: string;
    imageBackground?: string;
};

const DEFAULT_RESOURCES: Resource[] = [
    {
        description: 'Get started in 5 minutes or less!',
        image: 'https://solana.com/opengraph/developers/docs/intro/installation',
        link: 'https://solana.com/docs/intro/installation',
        title: 'Setup Your Solana Environment',
    },
    {
        description: 'Hands-on guide to the core concepts for building on Solana',
        image: 'https://solana.com/_next/image?url=%2Fassets%2Fdocs%2Fintro%2Fquickstart%2Fpg-not-connected.png&w=1920&q=75',
        link: 'https://solana.com/docs/intro/quick-start',
        title: 'Quick Start Guide',
    },
    {
        description: '11 hours of video lessons on Solana Development',
        image: 'https://i.ytimg.com/vi/amAq-WHAFs8/maxresdefault.jpg',
        link: 'https://www.youtube.com/watch?v=amAq-WHAFs8',
        title: 'Solana Developer Bootcamp',
    },
    {
        description: 'A course designed for EVM developers to learn Solana',
        image: 'https://www.rareskills.io/wp-content/uploads/2024/08/og-image-rareskills.png',
        imageBackground: 'white',
        link: 'https://www.rareskills.io/solana-tutorial',
        title: '60 Days of Solana',
    },
];

export function DeveloperResources({ resources = DEFAULT_RESOURCES }: { resources?: Resource[] }) {
    return (
        <Card ui="dashkit" className="mb-3 md:mb-6">
            <div className="flex justify-between border-0 border-b border-solid border-dark-border px-dk-4 py-3">
                <div>Kickstart your development journey on Solana</div>
                <div>
                    Find more on{' '}
                    <a href="https://solana.com/developers" target="_blank" rel="noreferrer">
                        solana.com/developers
                    </a>
                </div>
            </div>
            <CardBody ui="dashkit">
                <div className="flex gap-6 overflow-auto pb-3">
                    {resources.map(resource => (
                        <ResourceCard key={resource.link} {...resource} />
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

function ResourceCard({ title, description, image, link, imageBackground }: Resource) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="flex flex-col" style={{ height: '200px', width: '250px' }}>
            <div className="mb-3 w-full">
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:cursor-pointer">
                    <div className="bg-heavy-metal-700" style={{ height: '120px', width: '250px' }}>
                        {image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={image}
                                alt={`${title} preview`}
                                onLoad={() => setLoaded(true)}
                                onError={() => setLoaded(false)}
                                style={{
                                    backgroundColor: imageBackground,
                                    display: loaded ? 'block' : 'none',
                                    height: '120px',
                                    objectFit: 'cover',
                                    width: '250px',
                                }}
                            />
                        )}
                    </div>
                </a>
            </div>
            <div className="flex flex-col">
                <p className="mb-[3px]">{title}</p>
                <p className="mb-1.5 line-clamp-3 whitespace-normal text-dk-gray-700">{description}</p>
            </div>
        </div>
    );
}
