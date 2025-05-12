import { fetch } from 'cross-fetch';
import useSWRImmutable from 'swr/immutable';

import { getCodamaIdl } from '../components/instruction/codama/getCodamaIdl';

const PMP_IDL_ENABLED = process.env.NEXT_PUBLIC_PMP_IDL_ENABLED === 'true';

export function useCodamaIdl(programAddress: string, url: string) {
    const { data } = useSWRImmutable(`codama-idl-${programAddress}-${url}`, async () => {
        if (!PMP_IDL_ENABLED) {
            return null;
        }

        try {
            const response = await fetch(`/api/codama?programAddress=${programAddress}&url=${encodeURIComponent(url)}`);
            if (response.ok) {
                return response.json().then(data => data.codamaIdl);
            }
            // Only attempt to fetch client side if the url is localhost or 127.0.0.1
            if (new URL(url).hostname === 'localhost' || new URL(url).hostname === '127.0.0.1') {
                return getCodamaIdl(programAddress, url);
            }
            return null;
        } catch (error) {
            console.error('Error fetching codama idl', error);
            return null;
        }
    });
    return { codamaIdl: data };
}
