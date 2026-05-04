export interface WorkspaceSelectionIO {
    input: NodeJS.ReadableStream;
    output: NodeJS.WritableStream;
    isTTY: boolean;
}
export interface WorkspacePickerEntry {
    label: string;
    workspaceRoot: string;
}
interface NumberedWorkspaceEntry {
    entry: WorkspacePickerEntry;
    index: number;
}
export declare class WorkspaceSelectionCancelledError extends Error {
    readonly exitCode = 1;
    constructor();
}
export declare function promptForWorkspaceSelection(params: {
    heading: string;
    entries: WorkspacePickerEntry[];
    io: WorkspaceSelectionIO;
}): Promise<WorkspacePickerEntry>;
export declare function formatWorkspaceSelectionList(entries: WorkspacePickerEntry[]): {
    text: string;
    numberedEntries: NumberedWorkspaceEntry[];
};
export {};
//# sourceMappingURL=workspacePicker.d.ts.map