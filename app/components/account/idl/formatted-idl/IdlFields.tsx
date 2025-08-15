'use client';

import { FieldType, StructField } from './formatters/FormattedIdl';
import { IdlDocTooltip } from './IdlDoc';

export function IdlFieldsView({ fieldType }: { fieldType: FieldType }) {
    switch (fieldType.kind) {
        case 'struct':
            return <IdlStructFieldsView fields={fieldType.fields} />;
        case 'enum':
            return <IdlEnumFieldsView variants={fieldType.variants} />;
        case 'type':
        case 'unknown':
            return <IdlTypeFieldView docs={fieldType.docs} name={fieldType.name} type={fieldType.type} />;
        default:
            return <></>;
    }
}

export function IdlStructFieldsView({ fields }: { fields?: StructField[] }) {
    if (!fields) return null;

    return (
        <div className="d-flex gap-2 flex-column align-items-start justify-start flex-wrap">
            {fields.map((field, index) => (
                <IdlDocTooltip key={index} docs={field.docs}>
                    <div className="d-inline-flex gap-2 align-items-center">
                        {field.name && <span>{field.name}:</span>}
                        <span className="badge bg-success-soft">{field.type}</span>
                    </div>
                </IdlDocTooltip>
            ))}
        </div>
    );
}

export function IdlEnumFieldsView({ variants }: { variants?: string[] }) {
    if (!variants?.length) return null;

    return (
        <div className="d-flex gap-2 flex-column align-items-start flex-wrap">
            {variants.map((variant, index) => (
                <span className="badge bg-secondary-soft" key={index}>
                    {variant}
                </span>
            ))}
        </div>
    );
}

export function IdlTypeFieldView({ docs, name, type }: { docs?: string[]; name?: string; type: string }) {
    return (
        <IdlDocTooltip docs={docs}>
            <div className="d-inline-flex gap-2 align-items-center">
                {!!name && <span>{name}:</span>}
                <span className="badge bg-success-soft">{type}</span>
            </div>
        </IdlDocTooltip>
    );
}
