export type TraceEventType =
    | "console"
    | "exception"
    | "request"
    | "response";

export interface TraceEvent {
    id: string;
    type: TraceEventType;
    timestamp: number;
    data: any;
}

export interface NetworkTrace {
    requestId: string;
    method: string;
    url: string;
    startTime: number;
    endTime?: number;
    status?: number;
    duration?: number;
    failed: boolean;
}