import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { parseControlConfig } from "./src/config/configParser";
import { validateControlConfig } from "./src/config/configValidator";
import { MultiPartyLookupApp } from "./src/components/MultiPartyLookupApp";
import { DataverseService } from "./src/services/DataverseService";
import { JunctionService } from "./src/services/JunctionService";
import { SearchService } from "./src/services/SearchService";

export class MultiJunctionLookup implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private root!: Root;
    private notifyOutputChanged!: () => void;
    private dataverseService!: DataverseService;
    private junctionService!: JunctionService;
    private searchService!: SearchService;
    private currentValue = "";
    private lastRawValue = "";

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.root = createRoot(container);
        this.notifyOutputChanged = notifyOutputChanged;
        this.dataverseService = new DataverseService(context.webAPI);
        this.junctionService = new JunctionService(this.dataverseService);
        this.searchService = new SearchService(this.dataverseService);
        this.currentValue = context.parameters.value.raw ?? "";
        this.lastRawValue = this.currentValue;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const rawValue = context.parameters.value.raw ?? "";

        if (rawValue !== this.lastRawValue) {
            this.currentValue = rawValue;
            this.lastRawValue = rawValue;
        }

        const parentId = this.getCurrentRecordId(context);
        const config = parseControlConfig(context, parentId);
        const boundFieldName = this.getBoundFieldName(context);
        const configurationDiagnostics = validateControlConfig(config, boundFieldName);

        this.root.render(
            React.createElement(MultiPartyLookupApp, {
                config,
                navigation: context.navigation,
                junctionService: this.junctionService,
                searchService: this.searchService,
                initialValue: this.currentValue,
                boundFieldName,
                configurationDiagnostics,
                onValueChange: (value: string) => {
                    this.currentValue = value;
                    this.notifyOutputChanged();
                }
            })
        );
    }

    public getOutputs(): IOutputs {
        return { value: this.currentValue };
    }

    public destroy(): void {
        this.root.unmount();
    }

    private getCurrentRecordId(context: ComponentFramework.Context<IInputs>): string {
        const pageContext = context as unknown as {
            page?: { entityId?: string };
        };

        return (pageContext.page?.entityId ?? "").replace(/[{}]/g, "");
    }

    private getBoundFieldName(context: ComponentFramework.Context<IInputs>): string {
        return (
            context.parameters.value.attributes as unknown as {
                LogicalName?: string;
            }
        )?.LogicalName ?? "";
    }
}
