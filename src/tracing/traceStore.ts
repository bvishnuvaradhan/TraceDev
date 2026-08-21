import * as vscode from "vscode";

import {
    TraceEventType,
    TraceEvent,
    NetworkTrace
} from "./traceStoreTypes";

import {
    Trace,
    TraceResource
} from "./traceModel";


class TraceStore {

    private events: TraceEvent[] = [];

    private requests =
        new Map<string, NetworkTrace>();

    private traces: Trace[] = [];

    private currentPageLoad:
        Trace | undefined;

    private readonly _onEvent =
        new vscode.EventEmitter<TraceEvent>();

    readonly onEvent =
        this._onEvent.event;


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


    startPageLoad(
        url: string
    ): Trace {

        /*
         * If another page load is still active,
         * finish it before starting a new one.
         */

        if (this.currentPageLoad) {

            this.finishPageLoad();
        }


        const trace: Trace = {

            id: crypto.randomUUID(),

            kind: "page-load",

            name: url,

            startTime: Date.now(),

            resources: []
        };


        this.traces.push(trace);

        this.currentPageLoad =
            trace;


        this._onEvent.fire({

            id: crypto.randomUUID(),

            type: "request",

            timestamp: Date.now(),

            data: {

                pageLoadStarted: true,

                traceId: trace.id
            }
        });


        return trace;
    }


    finishPageLoad(): void {

        if (!this.currentPageLoad) {
            return;
        }


        const trace =
            this.currentPageLoad;


        trace.endTime =
            Date.now();


        trace.duration =
            trace.endTime -
            trace.startTime;


        this.currentPageLoad =
            undefined;


        /*
         * Notify the Webview that
         * the page load has finished.
         */

        this._onEvent.fire({

            id: crypto.randomUUID(),

            type: "response",

            timestamp: Date.now(),

            data: {

                pageLoadFinished: true,

                traceId: trace.id
            }
        });
    }


    addResourceToPageLoad(
        resource: TraceResource
    ): void {

        if (!this.currentPageLoad) {
            return;
        }


        this.currentPageLoad.resources.push(
            resource
        );
    }


    startRequest(
        requestId: string,
        method: string,
        url: string,
        type?: string
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


        /*
         * A Document request represents
         * the beginning of a page load.
         */

        if (type === "Document") {

            this.startPageLoad(url);
        }


        /*
         * Resources belonging to
         * the current page load.
         */

        if (
            this.currentPageLoad &&
            (
                type === "Document" ||
                type === "Script" ||
                type === "Stylesheet" ||
                type === "Image" ||
                type === "Font"
            )
        ) {

            this.addResourceToPageLoad({

                requestId,

                method,

                url,

                startTime:
                    request.startTime,

                failed: false,

                type
            });
        }


        return request;
    }


    completeRequest(
        requestId: string,
        status: number
    ): NetworkTrace | undefined {

        const request =
            this.requests.get(
                requestId
            );


        if (!request) {
            return undefined;
        }


        request.endTime =
            Date.now();


        request.status =
            status;


        request.duration =
            request.endTime -
            request.startTime;


        request.failed =
            status >= 400;


        /*
         * Update corresponding
         * page-load resource.
         */

        if (this.currentPageLoad) {

            const resource =
                this.currentPageLoad.resources.find(
                    item =>
                        item.requestId ===
                        requestId
                );


            if (resource) {

                resource.status =
                    status;


                resource.endTime =
                    request.endTime;


                resource.duration =
                    request.duration;


                resource.failed =
                    request.failed;
            }
        }


        return request;
    }


    finishPageResource(
        requestId: string
    ): void {

        if (!this.currentPageLoad) {
            return;
        }


        const resource =
            this.currentPageLoad.resources.find(
                item =>
                    item.requestId ===
                    requestId
            );


        if (!resource) {
            return;
        }


        if (
            resource.endTime !==
            undefined
        ) {

            return;
        }


        resource.endTime =
            Date.now();


        resource.duration =
            resource.endTime -
            resource.startTime;
    }


    getRequests():
        NetworkTrace[] {

        return Array.from(
            this.requests.values()
        );
    }


    getTraces():
        Trace[] {

        return [...this.traces];
    }


    getAll():
        TraceEvent[] {

        return [...this.events];
    }


    clear(): void {

        this.events = [];

        this.requests.clear();

        this.traces = [];

        this.currentPageLoad =
            undefined;
    }


    dispose(): void {

        this._onEvent.dispose();
    }
}


export const traceStore =
    new TraceStore();