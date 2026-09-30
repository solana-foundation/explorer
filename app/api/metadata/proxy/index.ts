// Public surface for in-process callers that fetch through the proxy without an HTTP round trip.
export { MAX_SIZE, USER_AGENT } from './config';
export { fetchResource, matchJsonContent, statusError } from './feature';
export { logProxyError, logResourceFetched } from './log-proxy-error';
