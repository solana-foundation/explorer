import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ReactJson from 'react-json-view';

// TODO: Move utils to entities
import { getIdlSpecKeyType } from '@/app/utils/convertLegacyIdl';

import { AnchorFormattedIdl } from '../formatted-idl/ui/AnchorFormattedIdl';
import { CodamaFormattedIdl } from '../formatted-idl/ui/CodamaFormattedIdl';

export function IdlRenderer({
    idl,
    collapsed,
    raw,
    searchStr = '',
    programId,
}: {
    idl: any;
    collapsed: boolean | number;
    raw: boolean;
    searchStr: string;
    programId: string;
}) {
    if (raw) {
        return <IdlJson idl={idl} collapsed={collapsed} />;
    }

    const spec = getIdlSpecKeyType(idl);
    switch (spec) {
        case 'codama':
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering PMP IDL" />}>
                    <CodamaFormattedIdl idl={idl} searchStr={searchStr} />
                </ErrorBoundary>
            );
        default:
            return (
                <ErrorBoundary fallback={<IdlErrorFallback message="Error rendering Anchor IDL" />}>
                    {spec === 'legacy-shank' ? (
                        <div className="my-2">{`Note: Shank IDLs are not fully supported. Unused types may be absent from detailed view.`}</div>
                    ) : null}

                    <AnchorFormattedIdl idl={idl} programId={programId} searchStr={searchStr} />
                </ErrorBoundary>
            );
    }
}

function IdlErrorFallback({ message }: { message: string }) {
    return <center className="pt-5">{message}</center>;
}

const IdlJson = memo(({ idl, collapsed }: { idl: any; collapsed: boolean | number }) => {
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
