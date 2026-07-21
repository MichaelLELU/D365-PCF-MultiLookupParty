import { LookupItem } from "../models/types";

export const parsePendingItems = (value: string): LookupItem[] => {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? parsed as LookupItem[] : [];
    } catch {
        return [];
    }
};

export const serializePendingItems = (items: LookupItem[]): string =>
    JSON.stringify(items);
