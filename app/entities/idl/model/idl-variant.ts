/**
 * The on-chain source of a program's IDL: the PMP `idl` seed or the Anchor IDL account. The string values
 * double as the source id forwarded to the Castaway SDK generator as the `idlSource` query param.
 */
export enum IdlVariant {
    Anchor = 'anchor',
    ProgramMetadata = 'program-metadata',
}
