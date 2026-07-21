import { IInputs } from "../../generated/ManifestTypes";
import {
    MultiLookupConfig,
    TargetIconName,
    TargetTableConfig
} from "../models/types";
import { normalizeGuid } from "../utils/odata";

const optionalText = (value: string | null | undefined): string | undefined => {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
};

const parseIcon = (value: string | null | undefined): TargetIconName | undefined => {
    const normalized = value?.trim().toLowerCase();

    if (normalized === "person" || normalized === "building" || normalized === "generic") {
        return normalized;
    }

    return undefined;
};

const createTarget = (
    key: "target1" | "target2",
    tableName: string | null,
    entitySetName: string | null,
    primaryIdColumn: string | null,
    primaryNameColumn: string | null,
    junctionLookupColumn: string | null,
    displayLabel: string | null,
    icon: string | null,
    allowCreate: boolean | null,
    typeValue: number | null
): TargetTableConfig => ({
    key,
    tableName: tableName ?? "",
    entitySetName: entitySetName ?? "",
    primaryIdColumn: primaryIdColumn ?? "",
    primaryNameColumn: primaryNameColumn ?? "",
    junctionLookupColumn: junctionLookupColumn ?? "",
    displayLabel: optionalText(displayLabel) ?? tableName ?? key,
    icon: parseIcon(icon),
    allowCreate: allowCreate ?? false,
    typeValue: typeValue ?? undefined
});

export const parseControlConfig = (
    context: ComponentFramework.Context<IInputs>,
    parentId: string
): MultiLookupConfig => ({
    junctionTableName: context.parameters.junctionTableName.raw ?? "",
    junctionPrimaryIdColumn: context.parameters.junctionPrimaryIdColumn.raw ?? "",
    junctionNameColumn: optionalText(context.parameters.junctionNameColumn.raw),
    junctionTypeColumn: optionalText(context.parameters.junctionTypeColumn.raw),
    junctionRoleColumn: optionalText(context.parameters.junctionRoleColumn.raw),
    junctionRoleValue: context.parameters.junctionRoleValue.raw ?? undefined,
    parentTableName: context.parameters.parentTableName.raw ?? "",
    parentEntitySetName: context.parameters.parentEntitySetName.raw ?? "",
    parentLookupColumn: context.parameters.parentLookupColumn.raw ?? "",
    parentId: normalizeGuid(parentId),
    minimumSearchLength: Math.max(1, context.parameters.minimumSearchLength.raw ?? 3),
    placeholder: optionalText(context.parameters.placeholder.raw),
    targets: [
        createTarget(
            "target1",
            context.parameters.target1TableName.raw,
            context.parameters.target1EntitySetName.raw,
            context.parameters.target1PrimaryIdColumn.raw,
            context.parameters.target1PrimaryNameColumn.raw,
            context.parameters.target1LookupColumn.raw,
            context.parameters.target1DisplayLabel.raw,
            context.parameters.target1Icon.raw,
            context.parameters.target1AllowCreate.raw,
            context.parameters.target1TypeValue.raw
        ),
        createTarget(
            "target2",
            context.parameters.target2TableName.raw,
            context.parameters.target2EntitySetName.raw,
            context.parameters.target2PrimaryIdColumn.raw,
            context.parameters.target2PrimaryNameColumn.raw,
            context.parameters.target2LookupColumn.raw,
            context.parameters.target2DisplayLabel.raw,
            context.parameters.target2Icon.raw,
            context.parameters.target2AllowCreate.raw,
            context.parameters.target2TypeValue.raw
        )
    ]
});
