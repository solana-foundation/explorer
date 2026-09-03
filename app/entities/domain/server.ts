import 'server-only';

export { fetchAnsDomains } from './api/fetch-ans-domains';
export { fetchSnsDomains } from './api/fetch-sns-domains';
export { ResolvedDomainInfoSchema, resolveDomain, type ResolvedDomainInfo } from './api/resolve-domain';
export { Domain } from './lib/domain-struct';
export type { DomainInfo } from './model/types';
