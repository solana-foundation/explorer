import { type AnchorIdl, CodamaIdl, getDisplayIdlSpecType, type SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { useSetAtom } from 'jotai';
import { memo, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ReactJson from 'react-json-view';

import { AnchorFormattedIdl } from '../formatted-idl/ui/AnchorFormattedIdl';
import { CodamaFormattedIdl } from '../formatted-idl/ui/CodamaFormattedIdl';
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
                        <div className="my-2">{`Note: Shank IDLs are not fully supported. Unused types may be absent from detailed view.`}</div>
                    ) : null}

                    <AnchorFormattedIdl idl={idl as AnchorIdl} programId={programId} searchStr={searchStr} />
                </ErrorBoundary>
            );
    }
}

function IdlErrorFallback({ message, ...props }: { message: string }) {
    return (
        <center className="pt-5">
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
