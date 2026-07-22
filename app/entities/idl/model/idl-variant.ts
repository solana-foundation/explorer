/**
 * The IDL sources the program IDL card can surface (PMP, falling back to Anchor when it's the sole
 * source). The string values double as the source id forwarded to the Castaway SDK generator as the
 * `idlSource` query param.
 */
export enum IdlVariant {
    Anchor = 'anchor',
    ProgramMetadata = 'program-metadata',
}
