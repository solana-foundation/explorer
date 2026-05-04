import { RichListProvider } from '@providers/richList';
import { SupplyProvider } from '@providers/supply';

export default function SupplyLayout({ children }: { children: React.ReactNode }) {
    return (
        <SupplyProvider>
            <RichListProvider>{children}</RichListProvider>
        </SupplyProvider>
    );
}
