import * as React from "react";
import { DismissRegular, ErrorCircleRegular, WarningRegular } from "@fluentui/react-icons";
import { DiagnosticMessage } from "../models/diagnostics";

interface Props {
    diagnostics: DiagnosticMessage[];
    onDismiss?: () => void;
}

export const DiagnosticPanel: React.FC<Props> = ({ diagnostics, onDismiss }) => {
    if (diagnostics.length === 0) {
        return null;
    }

    const hasError = diagnostics.some(item => item.severity === "error");

    return (
        <div
            className={`mjl-diagnostic ${hasError ? "mjl-diagnostic-error" : "mjl-diagnostic-warning"}`}
            role={hasError ? "alert" : "status"}
        >
            <div className="mjl-diagnostic-header">
                <span className="mjl-diagnostic-title">
                    {hasError ? <ErrorCircleRegular /> : <WarningRegular />}
                    Configuration diagnostic
                </span>

                {onDismiss && (
                    <button
                        type="button"
                        className="mjl-diagnostic-dismiss"
                        aria-label="Dismiss diagnostic"
                        onClick={onDismiss}
                    >
                        <DismissRegular />
                    </button>
                )}
            </div>

            {diagnostics.map(item => (
                <div key={item.id} className="mjl-diagnostic-item">
                    <strong>{item.title}</strong>
                    <div>{item.message}</div>
                    {item.details && (
                        <details className="mjl-diagnostic-details">
                            <summary>Technical details</summary>
                            <pre>{item.details}</pre>
                        </details>
                    )}
                </div>
            ))}
        </div>
    );
};
