// Cluster-preserving path building now lives in the `cluster` FSD entity — it is cluster-domain logic
// (which of `cluster` and `customUrl` survive a navigation), not a generic URL utility. This file
// re-exports it so the existing `@utils/url` import sites keep working unchanged.
export { pickClusterParams, useBuildClusterPath, useClusterPath } from '@entities/cluster/model/use-cluster-path';
