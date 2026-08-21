import {
    TraceEvent
} from "./traceStoreTypes";


export interface TraceSession {

    id: string;

    pageUrl: string;

    startedAt: number;

    endedAt?: number;

    events: TraceEvent[];
}


export function createTraceSession(
    pageUrl: string,
    startedAt: number
): TraceSession {

    return {

        id: crypto.randomUUID(),

        pageUrl,

        startedAt,

        events: []
    };
}