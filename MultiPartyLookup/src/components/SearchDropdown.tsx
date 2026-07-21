import * as React from "react";
import { createPortal } from "react-dom";
import { LookupItem, TargetTableConfig } from "../models/types";
import { CreateActions } from "./CreateActions";
import { SearchResultList } from "./SearchResultList";

interface Props {
    isOpen: boolean;
    searchText: string;
    minimumSearchLength: number;
    results: LookupItem[];
    targets: TargetTableConfig[];
    anchorRef: React.RefObject<HTMLDivElement | null>;
    onSelect: (item: LookupItem) => void;
    onCreate: (target: TargetTableConfig) => void;
    onClose: () => void;
}

export const SearchDropdown: React.FC<Props> = ({
    isOpen,
    searchText,
    minimumSearchLength,
    results,
    targets,
    anchorRef,
    onSelect,
    onCreate,
    onClose
}) => {
    const dropdownRef = React.useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });

    const canDisplayResults = searchText.trim().length >= minimumSearchLength;
    const creatableTargets = targets.filter(target => target.allowCreate);

    React.useEffect(() => {
        if (!isOpen || !anchorRef.current) {
            return;
        }

        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor) return;

            const rect = anchor.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen, anchorRef, results, searchText]);

    React.useEffect(() => {
        if (!isOpen) return;

        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                anchorRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) {
                return;
            }

            onClose();
        };

        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [isOpen, anchorRef, onClose]);

    if (!isOpen || (!canDisplayResults && creatableTargets.length === 0)) {
        return null;
    }

    return createPortal(
        <div
            ref={dropdownRef}
            className="mjl-dropdown"
            style={{ top: position.top, left: position.left, width: position.width }}
        >
            {canDisplayResults && (
                <SearchResultList
                    results={results}
                    targets={targets}
                    onSelect={onSelect}
                />
            )}

            {canDisplayResults && results.length > 0 && creatableTargets.length > 0 && (
                <div className="mjl-separator" />
            )}

            <CreateActions targets={creatableTargets} onCreate={onCreate} />
        </div>,
        document.body
    );
};
