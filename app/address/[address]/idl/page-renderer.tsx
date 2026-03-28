import { ComponentType } from 'react';

export function PageRenderer({
    address,
    renderComponent: RenderComponent,
}: {
    address: string;
    renderComponent: ComponentType<{ address: string }>;
}) {
    return <RenderComponent address={address} />;
}
