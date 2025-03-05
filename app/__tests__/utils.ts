import { useSearchParams } from 'next/navigation';

// stub a test to not allow passing without tests
test('stub', () => expect(true).toBeTruthy());

//!!!

jest.mock('next/navigation');
export function mockUseSearchParams(cluster = 'mainnet-beta', customUrl?: string) {
    // @ts-expect-error mockReturnValue is not present
    useSearchParams.mockReturnValue({
        get: (param: string) => {
            if (param === 'cluster') return cluster;
            return null;
        },
        has: (param: string) => {
            if (param === 'customUrl' && customUrl) return true;
            return false;
        },
        toString: () => {
            let clusterString;
            if (cluster !== 'mainnet-beta') clusterString = `cluster=${cluster}`;
            if (customUrl) {
                return `customUrl=${customUrl}${clusterString ? `&${clusterString}` : ''}`;
            }
            return clusterString ?? '';
        },
    });
}
