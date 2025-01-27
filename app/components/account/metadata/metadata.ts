export default async function fetchMetadata(clusterSlug: string, metadataUri: string){
    const isProxyEnabled = process.env.NEXT_PUBLIC_METADATA_ENABLED === 'true'

    if (!isProxyEnabled) return fetch(metadataUri)

    return fetch(`/api/metadata/${clusterSlug}?uri=${encodeURI(metadataUri)}`)
}
