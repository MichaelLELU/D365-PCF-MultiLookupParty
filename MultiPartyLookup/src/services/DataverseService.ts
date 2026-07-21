export class DataverseService {
    public constructor(private readonly webApi: ComponentFramework.WebApi) {}

    public retrieveMultipleRecords(tableName: string, query: string) {
        return this.webApi.retrieveMultipleRecords(tableName, query);
    }

    public createRecord(tableName: string, data: Record<string, unknown>) {
        return this.webApi.createRecord(tableName, data);
    }

    public updateRecord(tableName: string, id: string, data: Record<string, unknown>) {
        return this.webApi.updateRecord(tableName, id, data);
    }

    public deleteRecord(tableName: string, id: string) {
        return this.webApi.deleteRecord(tableName, id);
    }
}
