import * as vscode from "vscode";

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

class TraceStore {

    private events: TraceEvent[] = [];

    private requests =
        new Map<string, NetworkTrace>();

    private readonly _onEvent =
        new vscode.EventEmitter<TraceEvent>();

    readonly onEvent = this._onEvent.event;

    add(
        type: TraceEventType,
        data: any
    ): TraceEvent {

        const event: TraceEvent = {
            id: crypto.randomUUID(),
            type,
            timestamp: Date.now(),
            data
        };

        this.events.push(event);

        this._onEvent.fire(event);

        return event;
    }

    startRequest(
        requestId: string,
        method: string,
        url: string
    ): NetworkTrace {

        const request: NetworkTrace = {
            requestId,
            method,
            url,
            startTime: Date.now(),
            failed: false
        };

        this.requests.set(
            requestId,
            request
        );

        return request;
    }

    completeRequest(
        requestId: string,
        status: number
    ): NetworkTrace | undefined {

        const request =
            this.requests.get(requestId);

        if (!request) {
            return undefined;
        }

        request.endTime = Date.now();

        request.status = status;

        request.duration =
            request.endTime -
            request.startTime;

        request.failed =
            status >= 400;

        return request;
    }

    getRequests(): NetworkTrace[] {
        return Array.from(
            this.requests.values()
        );
    }

    getAll(): TraceEvent[] {
        return [...this.events];
    }

    clear(): void {

        this.events = [];

        this.requests.clear();
    }

    dispose(): void {
        this._onEvent.dispose();
    }
}

export const traceStore =
    new TraceStore();