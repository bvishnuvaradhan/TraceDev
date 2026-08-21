export type TraceKind =
    | "page-load"
    | "user-action"
    | "network"
    | "error";

export interface TraceResource {
    requestId: string;
    method: string;
    url: string;
    status?: number;
    startTime: number;
    endTime?: number;
    duration?: number;
    failed: boolean;
    type?: string;
}

export interface Trace {
    id: string;
    kind: TraceKind;
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    resources: TraceResource[];
}