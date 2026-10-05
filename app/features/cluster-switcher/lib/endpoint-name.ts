import type { RpcEndpoint } from '@entities/cluster';

export function endpointName(endpoint: RpcEndpoint): string {
    return endpoint.isLocal ? endpoint.href : `${endpoint.protocol}//${endpoint.host}`;
}
