import { ErrorCard } from '@components/common/ErrorCard';

import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

export default function NotFoundPage() {
    return (
        <PageContainer className="mt-6">
            <ErrorCard text="Page not found" />
        </PageContainer>
    );
}
