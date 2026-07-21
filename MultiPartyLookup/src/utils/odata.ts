export const getLookupValueColumn = (lookupColumn: string): string =>
    `_${lookupColumn}_value`;

export const getFormattedValueColumn = (columnName: string): string =>
    `${columnName}@OData.Community.Display.V1.FormattedValue`;

export const escapeODataString = (value: string): string =>
    value.replace(/'/g, "''");

export const normalizeGuid = (value: string): string =>
    value.replace(/[{}]/g, "");
