import * as React from "react";
import { DiagnosticMessage } from "../models/diagnostics";
import { LookupItem, MultiLookupConfig, TargetTableConfig } from "../models/types";
import { JunctionService } from "../services/JunctionService";
import { SearchService } from "../services/SearchService";
import { createRuntimeDiagnostic } from "../utils/errorDiagnostics";
import { parsePendingItems, serializePendingItems } from "../utils/pendingItems";
import { DiagnosticPanel } from "./DiagnosticPanel";
import { PartyTag } from "./PartyTag";
import { SearchDropdown } from "./SearchDropdown";
import "../styles/MultiPartyLookup.css";

interface Props {
    config: MultiLookupConfig;
    navigation: ComponentFramework.Navigation;
    junctionService: JunctionService;
    searchService: SearchService;
    initialValue: string;
    boundFieldName: string;
    onValueChange: (value: string) => void;
    configurationDiagnostics: DiagnosticMessage[];
}

export const MultiPartyLookupApp: React.FC<Props> = ({
    config,
    navigation,
    junctionService,
    searchService,
    initialValue,
    boundFieldName,
    onValueChange,
    configurationDiagnostics
}) => {
    const fieldRef = React.useRef<HTMLDivElement | null>(null);
    const savingPendingRef = React.useRef(false);

    const [items, setItems] = React.useState<LookupItem[]>([]);
    const [pendingItems, setPendingItems] = React.useState<LookupItem[]>(() =>
        parsePendingItems(initialValue)
    );
    const [results, setResults] = React.useState<LookupItem[]>([]);
    const [searchText, setSearchText] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [runtimeDiagnostic, setRuntimeDiagnostic] = React.useState<DiagnosticMessage | null>(null);

    const displayedItems = config.parentId ? items : pendingItems;
    const hasConfigurationErrors = configurationDiagnostics.some(
        diagnostic => diagnostic.severity === "error"
    );

    const loadItems = React.useCallback(async () => {
        if (!config.parentId) return;

        try {
            const existing = await junctionService.getExistingLinks(config);
            const unique = existing.filter(
            (item, index, all) =>
                all.findIndex(
                    candidate =>
                        candidate.id === item.id &&
                        candidate.targetKey === item.targetKey
                ) === index
        );

            setItems(unique);
            setRuntimeDiagnostic(null);
        } catch (error) {
            console.error("Multi Junction Lookup load failed", error);
            setRuntimeDiagnostic(createRuntimeDiagnostic("load", error));
        }
    }, [config, junctionService]);

    React.useEffect(() => {
        if (!hasConfigurationErrors) {
            void loadItems();
        }
    }, [loadItems, hasConfigurationErrors]);

    React.useEffect(() => {
        const savePendingItems = async () => {
            if (
                hasConfigurationErrors ||
                !config.parentId ||
                pendingItems.length === 0 ||
                savingPendingRef.current
            ) {
                return;
            }

            savingPendingRef.current = true;

            try {
                const existing = await junctionService.getExistingLinks(config);
                const toCreate = pendingItems.filter(
                    pending =>
                        !existing.some(
                            current =>
                                current.id === pending.id &&
                                current.targetKey === pending.targetKey
                        )
                );

                for (const item of toCreate) {
                    await junctionService.createLink(config, item);
                }

                setPendingItems([]);
                onValueChange("");

                if (boundFieldName) {
                    await junctionService.clearPendingField(config, boundFieldName);
                }

                await loadItems();
                setRuntimeDiagnostic(null);
            } catch (error) {
                console.error("Multi Junction Lookup pending save failed", error);
                setRuntimeDiagnostic(createRuntimeDiagnostic("pending save", error));
            } finally {
                savingPendingRef.current = false;
            }
        };

        void savePendingItems();
    }, [
        config,
        pendingItems,
        junctionService,
        loadItems,
        onValueChange,
        boundFieldName,
        hasConfigurationErrors
    ]);

    React.useEffect(() => {
        const runSearch = async () => {
            if (hasConfigurationErrors) {
                setResults([]);
                return;
            }
            const value = searchText.trim();

            if (!isDropdownOpen || value.length < config.minimumSearchLength) {
                setResults([]);
                return;
            }

            try {
                setLoading(true);
                const found = await searchService.search(
                    value,
                    config.targets,
                    config.minimumSearchLength
                );

                setResults(
                    found.filter(
                        result =>
                            !displayedItems.some(
                                selected =>
                                    selected.id === result.id &&
                                    selected.targetKey === result.targetKey
                            )
                    )
                );
            } catch (error) {
                console.error("Multi Junction Lookup search failed", error);
                setRuntimeDiagnostic(createRuntimeDiagnostic("search", error));
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const timeout = window.setTimeout(runSearch, 300);
        return () => window.clearTimeout(timeout);
    }, [
        searchText,
        isDropdownOpen,
        config.minimumSearchLength,
        config.targets,
        searchService,
        displayedItems,
        hasConfigurationErrors
    ]);

    const closeDropdown = React.useCallback(() => {
        setIsDropdownOpen(false);
        setResults([]);
    }, []);

    const addItem = async (item: LookupItem) => {
        const alreadySelected = displayedItems.some(
            selected =>
                selected.id === item.id &&
                selected.targetKey === item.targetKey
        );

        if (alreadySelected) {
            setSearchText("");
            setResults([]);
            return;
        }

        if (!config.parentId) {
            const nextPendingItems = [...pendingItems, item];
            setPendingItems(nextPendingItems);
            onValueChange(serializePendingItems(nextPendingItems));
            setSearchText("");
            closeDropdown();
            return;
        }

        try {
            await junctionService.createLink(config, item);
            setRuntimeDiagnostic(null);
            setSearchText("");
            closeDropdown();
            await loadItems();
        } catch (error) {
            console.error("Multi Junction Lookup create failed", error);
            setRuntimeDiagnostic(createRuntimeDiagnostic("create link", error));
        }
    };

    const removeItem = async (item: LookupItem) => {
        if (!config.parentId) {
            const nextPendingItems = pendingItems.filter(
                pending =>
                    !(
                        pending.id === item.id &&
                        pending.targetKey === item.targetKey
                    )
            );

            setPendingItems(nextPendingItems);
            onValueChange(serializePendingItems(nextPendingItems));
            return;
        }

        if (!item.linkRecordId) return;

        try {
            await junctionService.deleteLink(config, item.linkRecordId);
            setRuntimeDiagnostic(null);
            await loadItems();
        } catch (error) {
            console.error("Multi Junction Lookup delete failed", error);
            setRuntimeDiagnostic(createRuntimeDiagnostic("delete link", error));
        }
    };

    const createNewRecord = async (target: TargetTableConfig) => {
        try {
            const result = await navigation.openForm({
                entityName: target.tableName,
                useQuickCreateForm: true
            });

            const created = result.savedEntityReference?.[0];
            if (!created) return;

            await addItem({
                id: created.id.replace(/[{}]/g, ""),
                name: created.name || `New ${target.displayLabel}`,
                targetKey: target.key,
                tableName: target.tableName
            });
        } catch (error) {
            console.error(`Quick create failed for ${target.tableName}`, error);
            setRuntimeDiagnostic(createRuntimeDiagnostic("quick create", error));
        }
    };

    const openRecord = (item: LookupItem) => {
        const url =
            `${window.location.origin}/main.aspx?pagetype=entityrecord` +
            `&etn=${encodeURIComponent(item.tableName)}` +
            `&id=${encodeURIComponent(item.id)}`;

        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="mjl">
            <DiagnosticPanel diagnostics={configurationDiagnostics} />
            {runtimeDiagnostic && (
                <DiagnosticPanel
                    diagnostics={[runtimeDiagnostic]}
                    onDismiss={() => setRuntimeDiagnostic(null)}
                />
            )}

            <div className={`mjl-field ${hasConfigurationErrors ? "mjl-field-disabled" : ""}`} ref={fieldRef}>
                {displayedItems.map(item => {
                    const target = config.targets.find(
                        candidate => candidate.key === item.targetKey
                    );

                    return target ? (
                        <PartyTag
                            key={`${item.targetKey}-${item.id}`}
                            item={item}
                            target={target}
                            onRemove={removeItem}
                            onOpen={openRecord}
                        />
                    ) : null;
                })}

                <input
                    className="mjl-input"
                    value={searchText}
                    placeholder={config.placeholder ?? ""}
                    disabled={hasConfigurationErrors}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={event => {
                        setSearchText(event.target.value);
                        setIsDropdownOpen(true);
                    }}
                    onKeyDown={event => {
                        if (event.key === "Escape") {
                            closeDropdown();
                        }
                    }}
                />

                <span className="mjl-search-icon">⌕</span>
            </div>

            {!config.parentId && pendingItems.length > 0 && (
                <div className="mjl-info">
                    These selections will be saved after the parent record is saved.
                </div>
            )}

            {loading && <div className="mjl-loading">Searching...</div>}

            <SearchDropdown
                isOpen={isDropdownOpen}
                searchText={searchText}
                minimumSearchLength={config.minimumSearchLength}
                results={results}
                targets={config.targets}
                anchorRef={fieldRef}
                onSelect={item => void addItem(item)}
                onCreate={target => void createNewRecord(target)}
                onClose={closeDropdown}
            />
        </div>
    );
};
