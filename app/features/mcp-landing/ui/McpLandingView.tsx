import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

import { McpExamplesSection } from './McpExamplesSection';
import { McpHeroSection } from './McpHeroSection';
import { McpSetupSection } from './McpSetupSection';
import { McpStatusSection } from './McpStatusSection';
import { McpToolsSection } from './McpToolsSection';

export function McpLandingView() {
    return (
        <PageContainer className="my-10 max-w-4xl space-y-14">
            <McpHeroSection />
            <McpStatusSection />
            <McpSetupSection />
            <McpToolsSection />
            <McpExamplesSection />
        </PageContainer>
    );
}
