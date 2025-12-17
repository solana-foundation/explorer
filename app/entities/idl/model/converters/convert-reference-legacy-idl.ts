// @ts-expect-error has no exported members: 'convertLegacyIdl', 'getIdlSpecType', 'formatIdl', '_convertType'
import { _convertType, convertLegacyIdl as c, formatIdl as f, getIdlSpecType as g } from '@solana-developers/helpers';

export const convertLegacyIdl = c;
export const formatIdl = f;
export const getIdlSpecType = g;
export const privateConvertType = _convertType;
