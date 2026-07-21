import * as React from "react";
import { LookupItem, TargetTableConfig } from "../models/types";
import { TargetIcon } from "./TargetIcon";

interface Props {
    results: LookupItem[];
    targets: TargetTableConfig[];
    onSelect: (item: LookupItem) => void;
}

export const SearchResultList: React.FC<Props> = ({ results, targets, onSelect }) => (
    <>
        {results.map(result => {
            const target = targets.find(candidate => candidate.key === result.targetKey);

            if (!target) {
                return null;
            }

            return (
                <button
                    key={`${result.targetKey}-${result.id}`}
                    type="button"
                    className="mjl-result"
                    onMouseDown={event => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                    onClick={() => onSelect(result)}
                >
                    <span className="mjl-icon">
                        <TargetIcon icon={target.icon} />
                    </span>
                    <span>{result.name}</span>
                </button>
            );
        })}
    </>
);
