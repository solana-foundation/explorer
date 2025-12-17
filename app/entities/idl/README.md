## Formatters

[formatSerdeIdl]() - formats IDL into a format that could be used to construct AnchorProgram instance. Descendant of [convertLegacyIdl](https://github.com/solana-developers/helpers/blob/main/src/lib/convertLegacyIdl.ts), but reworked for Explorer's usage

[formatDisplayIdl]() - formats IDL into a format that is used to display IDL in a human-readable format. Keeps original version of conversion logic that was introduced for Explorer

[formatReferenceSerdeIdl]() - reference implementation for the formatter. Used only to keep track of limitations of original implementation
