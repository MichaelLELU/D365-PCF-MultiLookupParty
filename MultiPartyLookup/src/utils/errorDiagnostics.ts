import { DiagnosticMessage } from "../models/diagnostics";

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message?: unknown }).message ?? "Unknown error");
    }

    return String(error);
};

export const createRuntimeDiagnostic = (
    operation: string,
    error: unknown
): DiagnosticMessage => {
    const rawMessage = getErrorMessage(error);
    const normalized = rawMessage.toLowerCase();

    let message = `The ${operation} operation failed.`;

    if (normalized.includes("undeclared property")) {
        message =
            "A configured lookup/navigation property was not found. Verify the parent and target junction lookup values exactly as defined in Dataverse metadata.";
    } else if (normalized.includes("does not exist") || normalized.includes("not found")) {
        message =
            "A configured table, column, entity set, or navigation property could not be found.";
    } else if (normalized.includes("privilege") || normalized.includes("permission")) {
        message =
            "The current user does not have sufficient Dataverse permissions for this operation.";
    } else if (normalized.includes("required") || normalized.includes("mandatory")) {
        message =
            "Dataverse rejected the operation because a required junction-table column was not populated.";
    }

    return {
        id: `runtime-${Date.now()}`,
        severity: "error",
        title: "Multi Junction Lookup error",
        message,
        details: rawMessage
    };
};
