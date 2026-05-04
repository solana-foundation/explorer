import { EpochProvider } from '@providers/epoch';

export default function EpochLayout({ children }: { children: React.ReactNode; params: Promise<{ epoch: string }> }) {
    return <EpochProvider>{children}</EpochProvider>;
}
