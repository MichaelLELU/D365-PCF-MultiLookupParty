import { DiagnosticMessage } from "../models/diagnostics";
import { MultiLookupConfig, TargetTableConfig } from "../models/types";

const required = (
    diagnostics: DiagnosticMessage[],
    value: string,
    id: string,
    label: string
): void => {
    if (!value.trim()) {
        diagnostics.push({
            id,
            severity: "error",
            title: "Missing configuration",
            message: `${label} is required.`
        });
    }
};

const validateTarget = (
    diagnostics: DiagnosticMessage[],
    target: TargetTableConfig,
    label: string
): void => {
    required(diagnostics, target.tableName, `${target.key}-table`, `${label} table`);
    required(diagnostics, target.entitySetName, `${target.key}-entity-set`, `${label} entity set`);
    required(diagnostics, target.primaryIdColumn, `${target.key}-primary-id`, `${label} primary ID`);
    required(diagnostics, target.primaryNameColumn, `${target.key}-primary-name`, `${label} primary name`);
    required(
        diagnostics,
        target.junctionLookupColumn,
        `${target.key}-junction-lookup`,
        `${label} junction lookup/navigation property`
    );
};

export const validateControlConfig = (
    config: MultiLookupConfig,
    boundFieldName: string
): DiagnosticMessage[] => {
    const diagnostics: DiagnosticMessage[] = [];

    required(diagnostics, config.junctionTableName, "junction-table", "Junction table");
    required(
        diagnostics,
        config.junctionPrimaryIdColumn,
        "junction-primary-id",
        "Junction primary ID"
    );
    required(diagnostics, config.parentTableName, "parent-table", "Parent table");
    required(diagnostics, config.parentEntitySetName, "parent-entity-set", "Parent entity set");
    required(
        diagnostics,
        config.parentLookupColumn,
        "parent-lookup",
        "Parent lookup/navigation property"
    );

    validateTarget(diagnostics, config.targets[0], "Target 1");
    validateTarget(diagnostics, config.targets[1], "Target 2");

    if (!boundFieldName.trim()) {
        diagnostics.push({
            id: "bound-field",
            severity: "error",
            title: "Pending field unavailable",
            message: "The control must be bound to a text column on the parent table."
        });
    }

    if (
        config.targets[0].junctionLookupColumn &&
        config.targets[0].junctionLookupColumn === config.targets[1].junctionLookupColumn
    ) {
        diagnostics.push({
            id: "duplicate-target-lookups",
            severity: "error",
            title: "Duplicate junction lookup",
            message: "Target 1 and Target 2 must use different lookup/navigation properties."
        });
    }

    if (config.junctionTypeColumn) {
        for (const target of config.targets) {
            if (target.typeValue === undefined) {
                diagnostics.push({
                    id: `${target.key}-type-value`,
                    severity: "warning",
                    title: "Missing type value",
                    message: `${target.displayLabel} has no type value although a junction type column is configured.`
                });
            }
        }
    }

    if (config.junctionRoleValue !== undefined && !config.junctionRoleColumn) {
        diagnostics.push({
            id: "role-column-missing",
            severity: "warning",
            title: "Unused role value",
            message: "A junction role value is configured without a junction role column."
        });
    }

    return diagnostics;
};
