import {
    BrowserClient
} from "../browser/chrome";

import {
    traceStore
} from "./traceStore";

function extractInitiator(
    initiator: any
): {
    type?: string;
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
    stack?: any;
} {

    const result: {
        type?: string;
        url?: string;
        lineNumber?: number;
        columnNumber?: number;
        stack?: any;
    } = {

        type:
            initiator.type,

        stack:
            initiator.stack
    };


    /*
     * Direct location.
     */

    if (
        initiator.url
    ) {

        result.url =
            initiator.url;

        result.lineNumber =
            initiator.lineNumber;

        result.columnNumber =
            initiator.columnNumber;

        return result;
    }


    /*
     * Chrome often puts the
     * useful location inside stack.
     */

    const stack =
        initiator.stack;


    if (!stack) {

        return result;
    }


    /*
     * Search normal stack frames.
     */

    const frames =
        stack.callFrames || [];


    for (
        const frame of frames
    ) {

        if (
            frame.url &&
            frame.url.startsWith("http")
        ) {

            result.url =
                frame.url;

            result.lineNumber =
                frame.lineNumber;

            result.columnNumber =
                frame.columnNumber;

            return result;
        }
    }


    /*
     * Search parent stack.
     */

    if (
        stack.parent
    ) {

        const parent: {
            type?: string;
            url?: string;
            lineNumber?: number;
            columnNumber?: number;
            stack?: any;
        } =
            extractInitiator({
                type:
                    initiator.type,

                stack:
                    stack.parent
            });


        if (
            parent.url
        ) {

            return {
                ...result,
                ...parent
            };
        }
    }


    return result;
}

export async function startBrowserTrace(
    client: BrowserClient
) {

    const {
        Runtime,
        Network
    } = client;


    /*
     * Enable Runtime events.
     */

    await Runtime.enable();


    /*
     * Enable Network events.
     */

    await Network.enable();


    /*
     * Console messages.
     */

    Runtime.consoleAPICalled(
        (params: any) => {

            const args =
                params.args || [];


            const values =
                args.map(
                    (arg: any) => {

                        if (
                            arg.value !==
                            undefined
                        ) {

                            return arg.value;
                        }


                        if (
                            arg.description !==
                            undefined
                        ) {

                            return arg.description;
                        }


                        if (
                            arg.unserializableValue !==
                            undefined
                        ) {

                            return arg.unserializableValue;
                        }


                        return "[object]";
                    }
                );


            console.log(
                "TraceDev Console Data:",
                {
                    type:
                        params.type,

                    args,

                    values
                }
            );


            const event =
                traceStore.add(
                    "console",
                    {

                        type:
                            params.type,

                        values,

                        args,

                        executionContextId:
                            params.executionContextId,

                        timestamp:
                            Date.now()
                    }
                );


            console.log(
                "TraceDev Console Event:",
                event
            );
        }
    );


    /*
     * Runtime exceptions.
     */

    Runtime.exceptionThrown(
        (params: any) => {

            const details =
                params.exceptionDetails;


            const event =
                traceStore.add(
                    "exception",
                    {

                        text:
                            details?.text,

                        url:
                            details?.url,

                        lineNumber:
                            details?.lineNumber,

                        columnNumber:
                            details?.columnNumber,

                        stackTrace:
                            details?.stackTrace,

                        exceptionDetails:
                            details
                    }
                );


            console.log(
                "TraceDev Exception Event:",
                event
            );
        }
    );


    /*
     * Network request started.
     */

    Network.requestWillBeSent(
        (params: any) => {

            /*
             * Chrome tells us what
             * initiated the request.
             */

            const initiator =
                params.initiator
                    ? extractInitiator(
                        params.initiator
                    )
                    : undefined;


            console.log(
                "TraceDev Initiator:",
                initiator
            );


            /*
             * Store request.
             */

            const request =
                traceStore.startRequest(

                    params.requestId,

                    params.request.method,

                    params.request.url,

                    params.type,

                    initiator
                );


            /*
             * Store event.
             */

            traceStore.add(
                "request",
                {

                    requestId:
                        params.requestId,

                    method:
                        params.request.method,

                    url:
                        params.request.url,

                    type:
                        params.type,

                    initiator,

                    timestamp:
                        Date.now()
                }
            );


            console.log(
                "TraceDev Request Started:",
                request
            );
        }
    );


    /*
     * Network response received.
     */

    Network.responseReceived(
        (params: any) => {

            const request =
                traceStore.completeRequest(

                    params.requestId,

                    params.response.status
                );


            traceStore.add(
                "response",
                {

                    requestId:
                        params.requestId,

                    status:
                        params.response.status,

                    statusText:
                        params.response.statusText,

                    url:
                        params.response.url,

                    type:
                        params.type,

                    timestamp:
                        Date.now()
                }
            );


            console.log(
                "TraceDev Request Completed:",
                request
            );
        }
    );


    /*
     * Resource finished loading.
     */

    Network.loadingFinished(
        (params: any) => {

            traceStore.finishPageResource(
                params.requestId
            );


            /*
             * Check whether all resources
             * of the current page are done.
             */

            const traces =
                traceStore.getTraces();


            const currentPageLoad =
                traces[
                    traces.length - 1
                ];


            if (
                currentPageLoad &&
                currentPageLoad.kind ===
                    "page-load" &&
                currentPageLoad.endTime ===
                    undefined
            ) {

                const resources =
                    currentPageLoad.resources;


                const allFinished =
                    resources.length > 0 &&
                    resources.every(
                        resource =>
                            resource.endTime !==
                            undefined
                    );


                if (allFinished) {

                    traceStore.finishPageLoad();
                }
            }


            console.log(
                "TraceDev Resource Finished:",
                params.requestId
            );
        }
    );


    /*
     * Resource failed.
     */

    Network.loadingFailed(
        (params: any) => {

            traceStore.add(
                "exception",
                {

                    requestId:
                        params.requestId,

                    errorText:
                        params.errorText,

                    canceled:
                        params.canceled,

                    blockedReason:
                        params.blockedReason,

                    timestamp:
                        Date.now()
                }
            );


            console.log(
                "TraceDev Resource Failed:",
                params
            );
        }
    );


    console.log(
        "TraceDev: Browser tracing started"
    );
}