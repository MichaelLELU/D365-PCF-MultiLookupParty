export type DiagnosticSeverity = "error" | "warning";

export interface DiagnosticMessage {
    id: string;
    severity: DiagnosticSeverity;
    title: string;
    message: string;
    details?: string;
}
