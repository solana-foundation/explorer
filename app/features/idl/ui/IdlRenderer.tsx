import { type AnchorIdl, CodamaIdl, getDisplayIdlSpecType, getIdlStandard, type SupportedIdl } from '@entities/idl';
import ReactJson from '@microlink/react-json-view';
import { PublicKey } from '@solana/web3.js';
import { useSetAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AnchorFormattedIdl } from '../formatted-idl/ui/AnchorFormattedIdl';
import { CodamaFormattedIdl } from '../formatted-idl/ui/CodamaFormattedIdl';
import { trackIdlViewed } from '../interactive-idl/lib/analytics';
import { originalIdlAtom, programIdAtom } from '../interactive-idl/model/state-atoms';
import type { BaseIdl } from '../interactive-idl/model/unified-program';

export function IdlRenderer({
    idl,
    collapsed,
    raw,
    searchStr = '',
    programId,
}: {
    idl: SupportedIdl;
    collapsed: boolean | number;
    raw: boolean;
    searchStr: string;
    programId: string;
}) {
    const setOriginalIdl = useSetAtom(originalIdlAtom);
    const setProgramId = useSetAtom(programIdAtom);

    useEffect(() => {
        setOriginalIdl(idl as BaseIdl);
        setProgramId(new PublicKey(programId));
    }, [idl, programId, setOriginalIdl, setProgramId]);

    const [hasTrackedView, setHasTrackedView] = useState(false);
    useEffect(() => {
        if (!hasTrackedView) {
            trackIdlViewed(getIdlStandard(idl), programId);
            setHasTrackedView(true);
        }
    }, [hasTrackedView, idl, programId]);

    if (raw) {
        return <IdlJson idl={idl} collapsed={collapsed} />;
    }

    const spec = getDisplayIdlSpecType(idl);
    switch (spec) {
        case 'codama':
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering PMP IDL" />}>
                    <CodamaFormattedIdl idl={idl as CodamaIdl} programId={programId} searchStr={searchStr} />
                </ErrorBoundary>
            );
        default:
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering Anchor IDL" />}>
                    {spec === 'legacy-shank' ? (
                        <div className="my-1.5">{`Note: Shank IDLs are not fully supported. Unused types may be absent from detailed view.`}</div>
                    ) : null}

                    <AnchorFormattedIdl idl={idl as AnchorIdl} programId={programId} searchStr={searchStr} />
                </ErrorBoundary>
            );
    }
}

function IdlErrorFallback({ message, ...props }: { message: string }) {
    return (
        <center className="pt-9">
            {message}
            {JSON.stringify(props, undefined, 2)}
        </center>
    );
}

const IdlJson = memo(({ idl, collapsed }: { idl: SupportedIdl; collapsed: boolean | number }) => {
    return (
        <ReactJson
            src={idl}
            theme="solarized"
            style={{ padding: 25 }}
            name={null}
            enableClipboard={true}
            collapsed={collapsed}
            displayObjectSize={false}
            displayDataTypes={false}
            displayArrayKey={false}
        />
    );
});
IdlJson.displayName = 'IdlJsonViewer';
