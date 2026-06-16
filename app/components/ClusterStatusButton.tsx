'use client';

import { useCluster, useClusterModal } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'react-feather';

import { Button } from './shared/ui/button';

function getCustomUrlClusterName(customUrl: string) {
    try {
        const url = new URL(customUrl);
        if (url.hostname === 'localhost') {
            return customUrl;
        }
        return `${url.protocol}//${url.hostname}`;
    } catch (_e) {
        return customUrl;
    }
}

export const ClusterStatusButton = () => {
    const { status, cluster, name, customUrl } = useCluster();
    const [, setShow] = useClusterModal();

    const onClickHandler = useCallback(() => setShow(true), [setShow]);
    const statusName = cluster !== Cluster.Custom ? `${name}` : getCustomUrlClusterName(customUrl);

    const spinnerClasses = 'align-text-top spinner-grow spinner-grow-sm mr-1.5';

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <Button ui="dashkit" variant="primary" className="!block" asChild>
                    <span onClick={onClickHandler}>
                        <CheckCircle className="mr-1.5" size={15} />
                        {statusName}
                    </span>
                </Button>
            );

        case ClusterStatus.Connecting:
            return (
                <Button ui="dashkit" variant="warning" className="!block" asChild>
                    <span onClick={onClickHandler}>
                        <span className={spinnerClasses} role="status" aria-hidden="true"></span>
                        {statusName}
                    </span>
                </Button>
            );

        case ClusterStatus.Failure:
            return (
                <Button ui="dashkit" variant="danger" className="!block" asChild>
                    <span onClick={onClickHandler}>
                        <AlertCircle className="mr-1.5" size={15} />
                        {statusName}
                    </span>
                </Button>
            );
    }
};
