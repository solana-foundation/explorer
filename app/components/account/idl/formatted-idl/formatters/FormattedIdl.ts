// renderable idl for ui
export type FormattedIdl = {
    instructions?: InstructionData[];
    accounts?: AccountData[];
    types?: TypeData[];
    errors?: ErrorData[];
    constants?: ConstantData[];
    events?: EventData[];
    pdas?: PdaData[];
};

export type InstructionData = {
    docs: string[];
    name: string;
    accounts: Array<InstructionAccountData | NestedInstructionAccountsData>;
    args: ArgField[];
};

export type NestedInstructionAccountsData = {
    name: string;
    accounts: InstructionAccountData[];
};

export type InstructionAccountData = {
    docs: string[];
    name: string;
    writable?: boolean;
    signer?: boolean;
    optional?: boolean;
    pda?: boolean; // TODO: may be keep seeds inside?
};

export type ErrorData = {
    code: string;
    name: string;
    message: string;
};

type ConstantData = {
    docs: string[];
    name: string;
    type: string;
    value: string;
};

type TypeData = {
    docs: string[];
    name: string;
    fieldType: FieldType | null; // struct, enum, type, or unknown
};

type AccountData = TypeData;
type EventData = TypeData;

export type PdaData = {
    docs: string[];
    name: string;
    seeds: FieldType[]; // most likely array of types, e.g seed (TypeField: bytes) + pubkey (Typefield: publicKey)
};

type ArgField = {
    docs: string[];
    name: string;
    type: string; // type of the field, e.g. "u64", "string", "publicKey", etc.
};

export type StructField = {
    name?: string;
    docs?: string[];
    type: string; // type of the field, e.g. "u64", "string", "publicKey", etc.
};

export type StructFieldType = {
    kind: 'struct';
    docs?: string[];
    fields?: Array<StructField>;
};

export type EnumFieldType = {
    kind: 'enum';
    docs?: string[];
    variants: string[];
};

export type TypeFieldType = {
    kind: 'type';
    docs?: string[];
    name?: string;
    type: string;
};

export type UnknownFieldType = {
    kind: 'unknown';
    docs?: string[];
    name?: string;
    type: string;
};

export type FieldType = StructFieldType | EnumFieldType | TypeFieldType | UnknownFieldType;
