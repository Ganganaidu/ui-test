import type { DeviceInventoryDiagnostic, DeviceInventoryEntry } from '@usb-ui-test/common';
export interface DeviceSelectionIO {
    input: NodeJS.ReadableStream;
    output: NodeJS.WritableStream;
    isTTY: boolean;
}
interface NumberedEntry {
    entry: DeviceInventoryEntry;
    index: number;
}
export declare function promptForDeviceSelection(params: {
    heading: string;
    entries: DeviceInventoryEntry[];
    selectableEntries?: DeviceInventoryEntry[];
    io: DeviceSelectionIO;
}): Promise<DeviceInventoryEntry>;
export declare function formatDeviceSelectionList(entries: DeviceInventoryEntry[]): {
    text: string;
    numberedEntries: NumberedEntry[];
};
export declare function formatDeviceSelectionList(entries: DeviceInventoryEntry[], selectableEntries: DeviceInventoryEntry[]): {
    text: string;
    numberedEntries: NumberedEntry[];
};
export declare function printInventorySummary(params: {
    heading: string;
    entries: DeviceInventoryEntry[];
    selectableEntries: DeviceInventoryEntry[];
    output: NodeJS.WritableStream;
}): void;
export declare function formatDiagnosticsForOutput(diagnostics: DeviceInventoryDiagnostic[]): string;
export declare function printDiagnosticsFailure(params: {
    heading: string;
    diagnostics: DeviceInventoryDiagnostic[];
    output: NodeJS.WritableStream;
}): void;
export {};
//# sourceMappingURL=deviceInventoryPresenter.d.ts.map