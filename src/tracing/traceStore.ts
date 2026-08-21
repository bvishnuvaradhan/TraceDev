export type TraceEventType =
    | "console"
    | "exception"
    | "request"
    | "response";

export interface TraceEvent {
    id: string;
    type: TraceEventType;
    timestamp: number;
    data: unknown;
}

class TraceStore {

    private events: TraceEvent[] = [];

    add(
        type: TraceEventType,
        data: unknown
    ): TraceEvent {

        const event: TraceEvent = {
            id: crypto.randomUUID(),
            type,
            timestamp: Date.now(),
            data
        };

        this.events.push(event);

        return event;
    }

    getAll(): TraceEvent[] {
        return [...this.events];
    }

    clear(): void {
        this.events = [];
    }
}

export const traceStore = new TraceStore();