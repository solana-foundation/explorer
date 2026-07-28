import { cn } from '@components/shared/utils';
import { Cluster, clusterName } from '@utils/cluster';

/** Spinner + "checking <cluster>" shown while probing other clusters for a missing resource. */
export function SearchingClusterIndicator({ searchingCluster }: { searchingCluster: Cluster }) {
    return (
        <>
            <span
                style={{ height: '10px', marginRight: '5px', width: '10px' }}
                className={cn('spinner-grow spinner-grow-sm', 'inline-block align-middle')}
            />
            <span className="align-middle text-dk-gray-700" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                checking {clusterName(searchingCluster).toLowerCase()}
            </span>
        </>
    );
}
