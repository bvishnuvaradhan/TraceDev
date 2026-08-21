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

import {
    sessionStore
} from "./sessionStore";


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


    /*
     * Add a TraceDev event.
     *
     * All request, response,
     * console and exception events
     * pass through here.
     */
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


        /*
         * Store globally.
         */
        this.events.push(
            event
        );


        /*
         * Also attach the event
         * to the active Trace Session.
         */
        sessionStore.addEvent(
            event
        );


        /*
         * Notify the UI.
         */
        this._onEvent.fire(
            event
        );


        return event;
    }


    /*
     * Start a new page-load trace.
     */
    startPageLoad(
        url: string
    ): Trace {

        /*
         * Finish the previous page load
         * if one is still active.
         */
        if (
            this.currentPageLoad
        ) {

            this.finishPageLoad();
        }


        /*
         * Create the page-load trace.
         */
        const trace: Trace = {

            id: crypto.randomUUID(),

            kind: "page-load",

            name: url,

            startTime: Date.now(),

            resources: []
        };


        /*
         * Store the trace.
         */
        this.traces.push(
            trace
        );


        /*
         * Make this the active page load.
         */
        this.currentPageLoad =
            trace;


        /*
         * Start a corresponding
         * Trace Session.
         */
        sessionStore.startSession(
            url,
            trace.startTime
        );


        /*
         * Record page-load start
         * as a normal TraceEvent.
         *
         * Because this uses add(),
         * it is automatically attached
         * to the active session.
         */
        this.add(
            "request",
            {

                pageLoadStarted: true,

                traceId:
                    trace.id,

                url
            }
        );


        return trace;
    }


    /*
     * Finish the current page-load trace.
     */
    finishPageLoad(): void {

        if (
            !this.currentPageLoad
        ) {

            return;
        }


        const trace =
            this.currentPageLoad;


        /*
         * Finish timing.
         */
        trace.endTime =
            Date.now();


        trace.duration =
            trace.endTime -
            trace.startTime;


        /*
         * Clear active page load.
         */
        this.currentPageLoad =
            undefined;


        /*
         * Record page-load completion.
         *
         * This also goes into the
         * active Trace Session.
         */
        this.add(
            "response",
            {

                pageLoadFinished: true,

                traceId:
                    trace.id,

                url:
                    trace.name,

                duration:
                    trace.duration
            }
        );
    }


    /*
     * Add a browser resource to
     * the current page-load trace.
     */
    addResourceToPageLoad(
        resource: TraceResource
    ): void {

        if (
            !this.currentPageLoad
        ) {

            return;
        }


        this.currentPageLoad.resources.push(
            resource
        );
    }


    /*
     * Start tracking a network request.
     */
    startRequest(
        requestId: string,

        method: string,

        url: string,

        type?: string,

        initiator?: {

            type?: string;

            url?: string;

            lineNumber?: number;

            columnNumber?: number;

            stack?: any;
        }

    ): NetworkTrace {

        const request: NetworkTrace = {

            requestId,

            method,

            url,

            startTime: Date.now(),

            failed: false,

            type,

            initiator
        };


        /*
         * Store request.
         */
        this.requests.set(
            requestId,
            request
        );


        /*
         * Document requests represent
         * a new page load.
         */
        if (
            type === "Document"
        ) {

            this.startPageLoad(
                url
            );
        }


        /*
         * Add browser resources to
         * the active page load.
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

                failed:
                    false,

                type
            });
        }


        return request;
    }


    /*
     * Complete a network request.
     */
    completeRequest(
        requestId: string,

        status: number

    ): NetworkTrace | undefined {

        const request =
            this.requests.get(
                requestId
            );


        if (
            !request
        ) {

            return undefined;
        }


        /*
         * Finish timing.
         */
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
        if (
            this.currentPageLoad
        ) {

            const resource =
                this.currentPageLoad.resources.find(
                    item =>
                        item.requestId ===
                        requestId
                );


            if (
                resource
            ) {

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


    /*
     * Finish loading a page resource.
     */
    finishPageResource(
        requestId: string
    ): void {

        if (
            !this.currentPageLoad
        ) {

            return;
        }


        const resource =
            this.currentPageLoad.resources.find(
                item =>
                    item.requestId ===
                    requestId
            );


        if (
            !resource
        ) {

            return;
        }


        /*
         * Already finished.
         */
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


    /*
     * Get all network requests.
     */
    getRequests():
        NetworkTrace[] {

        return Array.from(
            this.requests.values()
        );
    }


    /*
     * Get all page-load traces.
     */
    getTraces():
        Trace[] {

        return [
            ...this.traces
        ];
    }


    /*
     * Get all events.
     */
    getAll():
        TraceEvent[] {

        return [
            ...this.events
        ];
    }


    /*
     * Get the currently active
     * page-load trace.
     */
    getCurrentPageLoad():
        Trace | undefined {

        return this.currentPageLoad;
    }


    /*
     * Clear TraceStore data.
     */
    clear(): void {

        this.events = [];

        this.requests.clear();

        this.traces = [];

        this.currentPageLoad =
            undefined;


        /*
         * Also clear sessions.
         */
        sessionStore.clear();
    }


    /*
     * Dispose resources.
     */
    dispose(): void {

        this._onEvent.dispose();
    }
}


/*
 * Single TraceStore instance.
 */
export const traceStore =
    new TraceStore();