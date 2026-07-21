export type TargetKey = "target1" | "target2";
export type TargetIconName = "person" | "building" | "generic";

export interface TargetTableConfig {
    key: TargetKey;
    tableName: string;
    entitySetName: string;
    primaryIdColumn: string;
    primaryNameColumn: string;
    junctionLookupColumn: string;
    displayLabel: string;
    icon?: TargetIconName;
    allowCreate: boolean;
    typeValue?: number;
}

export interface MultiLookupConfig {
    junctionTableName: string;
    junctionPrimaryIdColumn: string;
    junctionNameColumn?: string;
    junctionTypeColumn?: string;
    junctionRoleColumn?: string;
    junctionRoleValue?: number;
    parentTableName: string;
    parentEntitySetName: string;
    parentLookupColumn: string;
    parentId: string;
    minimumSearchLength: number;
    placeholder?: string;
    targets: [TargetTableConfig, TargetTableConfig];
}

export interface LookupItem {
    id: string;
    name: string;
    targetKey: TargetKey;
    tableName: string;
    linkRecordId?: string;
}
