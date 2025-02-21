import React from 'react';

import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

export const AppWrapper = ({ children }: React.PropsWithChildren) => {
    return (
        <ScrollAnchorProvider>
            <ClusterProvider>{children}</ClusterProvider>
        </ScrollAnchorProvider>
    );
};

test('should succeed', () => {
    expect(true).toEqual(expect.anything());
});
