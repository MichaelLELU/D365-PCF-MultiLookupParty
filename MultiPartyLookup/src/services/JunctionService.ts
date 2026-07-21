import { LookupItem, MultiLookupConfig } from "../models/types";
import {
    getFormattedValueColumn,
    getLookupValueColumn,
    normalizeGuid
} from "../utils/odata";
import { DataverseService } from "./DataverseService";

export class JunctionService {
    public constructor(private readonly dataverse: DataverseService) {}

    public async getExistingLinks(config: MultiLookupConfig): Promise<LookupItem[]> {
        const parentLookupValue = getLookupValueColumn(config.parentLookupColumn);
        const targetLookupValues = config.targets.map(target =>
            getLookupValueColumn(target.junctionLookupColumn)
        );

        const selectColumns = [
            config.junctionPrimaryIdColumn,
            ...targetLookupValues
        ];

        if (config.junctionNameColumn) {
            selectColumns.push(config.junctionNameColumn);
        }

        const filters = [`${parentLookupValue} eq ${config.parentId}`];

        if (config.junctionRoleColumn && config.junctionRoleValue !== undefined) {
            filters.push(`${config.junctionRoleColumn} eq ${config.junctionRoleValue}`);
        }

        const query =
            `?$select=${selectColumns.join(",")}` +
            `&$filter=${filters.join(" and ")}`;

        const response = await this.dataverse.retrieveMultipleRecords(
            config.junctionTableName,
            query
        );

        const items: LookupItem[] = [];

        for (const row of response.entities) {
            const target = config.targets.find(candidate => {
                const lookupColumn = getLookupValueColumn(candidate.junctionLookupColumn);
                return Boolean(row[lookupColumn]);
            });

            if (!target) {
                continue;
            }

            const lookupColumn = getLookupValueColumn(target.junctionLookupColumn);
            const cachedName = config.junctionNameColumn
                ? row[config.junctionNameColumn]
                : undefined;

            items.push({
                id: normalizeGuid(String(row[lookupColumn])),
                name: String(row[getFormattedValueColumn(lookupColumn)] ?? cachedName ?? ""),
                targetKey: target.key,
                tableName: target.tableName,
                linkRecordId: normalizeGuid(String(row[config.junctionPrimaryIdColumn]))
            });
        }

        return items;
    }

    public async createLink(config: MultiLookupConfig, item: LookupItem): Promise<void> {
        const target = config.targets.find(candidate => candidate.key === item.targetKey);

        if (!target) {
            throw new Error(`No target configuration found for ${item.targetKey}.`);
        }

        const data: Record<string, unknown> = {
            [`${config.parentLookupColumn}@odata.bind`]:
                `/${config.parentEntitySetName}(${config.parentId})`,
            [`${target.junctionLookupColumn}@odata.bind`]:
                `/${target.entitySetName}(${normalizeGuid(item.id)})`
        };

        if (config.junctionNameColumn) {
            data[config.junctionNameColumn] = item.name;
        }

        if (config.junctionTypeColumn && target.typeValue !== undefined) {
            data[config.junctionTypeColumn] = target.typeValue;
        }

        if (config.junctionRoleColumn && config.junctionRoleValue !== undefined) {
            data[config.junctionRoleColumn] = config.junctionRoleValue;
        }

        await this.dataverse.createRecord(config.junctionTableName, data);
    }

    public async deleteLink(config: MultiLookupConfig, linkRecordId: string): Promise<void> {
        await this.dataverse.deleteRecord(
            config.junctionTableName,
            normalizeGuid(linkRecordId)
        );
    }

    public async clearPendingField(
        config: MultiLookupConfig,
        boundFieldName: string
    ): Promise<void> {
        await this.dataverse.updateRecord(
            config.parentTableName,
            config.parentId,
            { [boundFieldName]: null }
        );
    }
}
