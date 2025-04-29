'use client';

import { useCluster, useClusterModal } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React, { useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'react-feather';

function getCustomUrlClusterName(customUrl: string) {
    const url = new URL(customUrl);
    if (url.hostname === 'localhost') {
        return customUrl;
    }
    return `${url.protocol}//${url.hostname}`;
}

export const ClusterStatusButton = () => {
    const { status, cluster, name, customUrl } = useCluster();
    const [, setShow] = useClusterModal();

    const onClickHandler = useCallback(() => setShow(true), [setShow]);
    const statusName = cluster !== Cluster.Custom ? `${name}` : getCustomUrlClusterName(customUrl);

    const btnClasses = (variant: string) => {
        return `btn d-block btn-${variant}`;
    };

    const spinnerClasses = 'align-text-top spinner-grow spinner-grow-sm me-2';

    switch (status) {
        case ClusterStatus.Connected:
            return (
                <span className={btnClasses('primary')} onClick={onClickHandler}>
                    <CheckCircle className="fe me-2" size={15} />
                    {statusName}
                </span>
            );

        case ClusterStatus.Connecting:
            return (
                <span className={btnClasses('warning')} onClick={onClickHandler}>
                    <span className={spinnerClasses} role="status" aria-hidden="true"></span>
                    {statusName}
                </span>
            );

        case ClusterStatus.Failure:
            return (
                <span className={btnClasses('danger')} onClick={onClickHandler}>
                    <AlertCircle className="me-2" size={15} />
                    {statusName}
                </span>
            );
    }
};
