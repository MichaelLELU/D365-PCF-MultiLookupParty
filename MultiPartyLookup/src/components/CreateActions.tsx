import * as React from "react";
import { AddRegular } from "@fluentui/react-icons";
import { TargetTableConfig } from "../models/types";
import { TargetIcon } from "./TargetIcon";

interface Props {
    targets: TargetTableConfig[];
    onCreate: (target: TargetTableConfig) => void;
}

export const CreateActions: React.FC<Props> = ({ targets, onCreate }) => (
    <>
        {targets.filter(target => target.allowCreate).map(target => (
            <button
                key={target.key}
                type="button"
                className="mjl-create"
                onMouseDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onClick={() => onCreate(target)}
            >
                <AddRegular />
                <TargetIcon icon={target.icon} />
                <span>New {target.displayLabel}</span>
            </button>
        ))}
    </>
);
