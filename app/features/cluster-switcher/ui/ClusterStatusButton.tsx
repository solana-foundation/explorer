'use client';

import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { clusterModalOpenAtom, type RpcEndpoint, useCluster } from '@entities/cluster';
import { ClusterStatus } from '@utils/cluster';
import { useSetAtom } from 'jotai';
import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'react-feather';

// The navbar's entry point to the switcher.
//
// Connection status and data provenance are separate facts, and both matter, so the icon carries status
// (spinner / tick / alert) and the colour carries provenance. A remote custom endpoint is amber, so the
// warning stays on screen for as long as it is in use rather than flashing once in a dialog; a local
// validator is not what we warn about. Failure stays red either way, being the more urgent fact.
export const ClusterStatusButton = () => {
    const { status, name, endpoint } = useCluster();
    const setShow = useSetAtom(clusterModalOpenAtom);

    const onClickHandler = useCallback(() => setShow(true), [setShow]);
    // An endpoint is present exactly on the Custom cluster, so its presence *is* "this is custom": the
    // component never names `Cluster.Custom` and cannot ask the two questions separately.
    const statusName = endpoint ? endpointClusterName(endpoint) : `${name}`;
    const isRemoteCustom = endpoint !== undefined && !endpoint.isLocal;

    const spinnerClasses = 'align-text-top spinner-grow spinner-grow-sm mr-1.5';
    const buttonClasses = '!block truncate';
    // Colour cannot be the only signal.
    const provenanceLabel = isRemoteCustom ? <span className="sr-only">Custom RPC endpoint. </span> : undefined;

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <Button
                    ui="dashkit"
                    variant="primary"
                    className={cn(buttonClasses, isRemoteCustom && REMOTE_CUSTOM_CLASSES)}
                    asChild
                >
                    <span onClick={onClickHandler}>
                        {provenanceLabel}
                        <CheckCircle className="mr-1.5" size={15} />
                        {statusName}
                    </span>
                </Button>
            );

        case ClusterStatus.Connecting:
            return (
                <Button
                    ui="dashkit"
                    variant="warning"
                    className={cn(buttonClasses, isRemoteCustom && REMOTE_CUSTOM_CLASSES)}
                    asChild
                >
                    <span onClick={onClickHandler}>
                        {provenanceLabel}
                        <span className={spinnerClasses} role="status" aria-hidden="true"></span>
                        {statusName}
                    </span>
                </Button>
            );

        case ClusterStatus.Failure:
            return (
                <Button ui="dashkit" variant="danger" className={buttonClasses} asChild>
                    <span onClick={onClickHandler}>
                        {provenanceLabel}
                        <AlertCircle className="mr-1.5" size={15} />
                        {statusName}
                    </span>
                </Button>
            );
    }
};

// The amber provenance treatment, applied over the ordinary status variant.
const REMOTE_CUSTOM_CLASSES =
    'bg-[#e08214] border-[#e08214] text-[#3a2205] hover:bg-[#c8730f] hover:border-[#bd6d0e] hover:text-white';

// Custom endpoints are long and often carry a key, so the button shows scheme + host only. A local
// endpoint is shown verbatim, because the port is the only thing separating one validator from another.
function endpointClusterName(endpoint: RpcEndpoint) {
    if (endpoint.isLocal) return endpoint.href;
    return `${endpoint.protocol}//${endpoint.host}`;
}
