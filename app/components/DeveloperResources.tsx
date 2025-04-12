'use client';

export function DeveloperResources() {
    return (
        <div className="card">
            <div className="card-body">
                <div className="card-title d-flex justify-content-between border-bottom border-gray-300 pb-2">
                    <div className="me-4">Kickstart your development journey on Solana</div>
                    <div>
                        Find more on{' '}
                        <a href="https://solana.com/developers" target="_blank" rel="noreferrer">
                            solana.com/developers
                        </a>
                    </div>
                </div>
                <div className="d-flex gap-4 pb-3 overflow-auto">
                    <ResourceCard
                        title="Setup Your Solana Environment"
                        description="Set up your local environment for Solana development"
                        image="https://solana.com/opengraph/developers/docs/intro/installation"
                        link="https://solana.com/docs/intro/installation"
                    />
                    <ResourceCard
                        title="Quick Start Guide"
                        description="A guide to help you get started with Solana development"
                        image="https://solana.com/_next/image?url=%2Fassets%2Fdocs%2Fintro%2Fquickstart%2Fpg-not-connected.png&w=1920&q=75"
                        link="https://solana.com/docs/intro/quick-start"
                    />
                    <ResourceCard
                        title="Solana Developer Bootcamp"
                        description="A comprehensive guide to Solana development"
                        image="https://i.ytimg.com/vi/amAq-WHAFs8/maxresdefault.jpg"
                        link="https://www.youtube.com/watch?v=amAq-WHAFs8&list=PLilwLeBwGuK7HN8ZnXpGAD9q6i4syhnVc&ab_channel=Solana"
                    />
                    <ResourceCard
                        title="Solana Tutorial"
                        description="A comprehensive guide to Solana development"
                        image="https://www.rareskills.io/wp-content/uploads/2024/08/og-image-rareskills.png"
                        imageBackground="white"
                        link="https://www.rareskills.io/solana-tutorial"
                    />
                </div>
            </div>
        </div>
    );
}

function ResourceCard({
    title,
    description,
    image,
    link,
    imageBackground,
}: {
    title: string;
    description: string;
    image: string;
    imageBackground?: string;
    link: string;
}) {
    return (
        <div className="flex flex-col" style={{ width: '250px', height: '200px' }}>
            <div className="w-full mb-3">
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:cursor-pointer">
                    <img
                        src={image}
                        alt={`${title} preview`}
                        style={{
                            width: '250px',
                            height: '120px',
                            objectFit: 'cover',
                            backgroundColor: imageBackground,
                        }}
                    />
                </a>
            </div>
            <div className="flex flex-col">
                <p className="mb-1">{title}</p>
                <p className="text-muted mb-2 text-wrap line-clamp-3">{description}</p>
            </div>
        </div>
    );
}
