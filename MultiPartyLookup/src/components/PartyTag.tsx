import * as React from "react";
import { DismissRegular } from "@fluentui/react-icons";
import { LookupItem, TargetTableConfig } from "../models/types";
import { TargetIcon } from "./TargetIcon";

interface Props {
    item: LookupItem;
    target: TargetTableConfig;
    onRemove: (item: LookupItem) => void;
    onOpen: (item: LookupItem) => void;
}

export const PartyTag: React.FC<Props> = ({ item, target, onRemove, onOpen }) => (
    <span className="mjl-tag">
        <span className="mjl-icon">
            <TargetIcon icon={target.icon} />
        </span>

        <a
            href="#"
            className="mjl-link"
            onClick={event => {
                event.preventDefault();
                onOpen(item);
            }}
        >
            {item.name}
        </a>

        <button
            type="button"
            className="mjl-remove"
            onClick={() => onRemove(item)}
            title="Remove"
        >
            <DismissRegular />
        </button>
    </span>
);
