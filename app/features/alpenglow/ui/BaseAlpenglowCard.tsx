import { Copyable } from '@components/common/Copyable';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { type Cluster, clusterName } from '@utils/cluster';

import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { type AlpenglowUpgrade } from '../lib/genesis-cert';

const ALPENGLOW_UPGRADE_URL = 'https://solana.com/upgrades/alpenglow';

export function BaseAlpenglowCard({ cluster, upgrade }: { cluster: Cluster; upgrade: AlpenglowUpgrade }) {
    return (
        <Card ui="dashkit" className="mb-3 md:mb-6">
            <CardHeader ui="dashkit">
                <CardTitle as="h4" ui="dashkit">
                    <span className="mr-2">🏔</span>
                    Alpenglow on {clusterName(cluster)}
                </CardTitle>
                <ExternalLink
                    className="text-dk-sm text-dk-primary-dark hover:text-dk-primary-on-dark"
                    href={ALPENGLOW_UPGRADE_URL}
                >
                    About the upgrade
                </ExternalLink>
            </CardHeader>
            <TableCardBody layout="expanded" className="[&_td:first-child]:!w-2/5 md:[&_td:first-child]:!w-auto">
                <tr>
                    <td className="w-full">Consensus</td>
                    <td className="text-right">
                        {upgrade.kind === 'migrated' ? (
                            <span className="text-dark-accent">Alpenglow</span>
                        ) : (
                            <span className="text-dark-muted-foreground">TowerBFT — Alpenglow not activated</span>
                        )}
                    </td>
                </tr>
                {upgrade.kind === 'migrated' && (
                    <>
                        <tr>
                            <td className="w-full">Genesis slot</td>
                            <td className="text-right font-mono">
                                <Slot slot={upgrade.cert.slot} link />
                            </td>
                        </tr>
                        <tr>
                            <td className="w-full">Certified block</td>
                            <td className="break-all text-right font-mono text-dk-sm">
                                <Copyable text={upgrade.cert.blockId}>{upgrade.cert.blockId}</Copyable>
                            </td>
                        </tr>
                    </>
                )}
            </TableCardBody>
        </Card>
    );
}
