import { LookupItem, TargetTableConfig } from "../models/types";
import { escapeODataString } from "../utils/odata";
import { DataverseService } from "./DataverseService";

export class SearchService {
    public constructor(private readonly dataverse: DataverseService) {}

    public async search(
        searchText: string,
        targets: TargetTableConfig[],
        minimumLength: number
    ): Promise<LookupItem[]> {
        const cleanSearch = escapeODataString(searchText.trim());

        if (cleanSearch.length < minimumLength) {
            return [];
        }

        const searches = targets.map(target => this.searchTarget(cleanSearch, target));
        const results = await Promise.all(searches);

        return results.flat();
    }

    private async searchTarget(
        cleanSearch: string,
        target: TargetTableConfig
    ): Promise<LookupItem[]> {
        const query =
            `?$select=${target.primaryIdColumn},${target.primaryNameColumn}` +
            `&$filter=startswith(${target.primaryNameColumn},'${cleanSearch}')` +
            `&$orderby=${target.primaryNameColumn} asc` +
            `&$top=10`;

        const response = await this.dataverse.retrieveMultipleRecords(
            target.tableName,
            query
        );

        return response.entities.map(entity => ({
            id: String(entity[target.primaryIdColumn]),
            name: String(entity[target.primaryNameColumn] ?? ""),
            targetKey: target.key,
            tableName: target.tableName
        }));
    }
}
