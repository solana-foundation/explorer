import { describe, expect, it, vi } from 'vitest';

import NFTokenCollectionPage from '../page';

const mocks = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock('@features/nftoken', () => ({ NftokenCollectionGrid: 'nftoken-collection-grid' }));
vi.mock('@utils/get-readable-title-from-address', () => ({ default: vi.fn() }));
vi.mock('next/navigation', () => ({
    notFound: () => {
        mocks.notFound();
        throw new Error('NEXT_NOT_FOUND');
    },
}));

describe('NFTokenCollectionPage', () => {
    it('should render the grid for a valid address', async () => {
        const address = 'D2VpbKpT725tdQyaNNZZwwS7Mqzgw4SZb2o4az5wA9vr';

        const element = await NFTokenCollectionPage({ params: Promise.resolve({ address }) });

        expect(element.props).toEqual({ collection: address });
    });

    it.each(['not-an-address', '0OIl', ''])('should call notFound for the address %j', async address => {
        await expect(NFTokenCollectionPage({ params: Promise.resolve({ address }) })).rejects.toThrow('NEXT_NOT_FOUND');
        expect(mocks.notFound).toHaveBeenCalled();
    });
});
