import {
    BrowserClient
} from "../browser/chrome";

import {
    traceStore
} from "./traceStore";


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

            const event =
                traceStore.add(
                    "console",
                    {

                        type:
                            params.type,

                        args:
                            params.args
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

            const event =
                traceStore.add(
                    "exception",
                    {

                        text:
                            params
                                .exceptionDetails
                                ?.text,

                        exceptionDetails:
                            params
                                .exceptionDetails
                    }
                );


            console.log(
                "TraceDev Exception Event:",
                event
            );
        }
    );


    /*
     * Request started.
     */

    Network.requestWillBeSent(
        (params: any) => {

            const request =
                traceStore.startRequest(

                    params.requestId,

                    params.request.method,

                    params.request.url,

                    params.type
                );


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
                        params.type
                }
            );


            console.log(
                "TraceDev Request Started:",
                request
            );
        }
    );


    /*
     * Response received.
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

                    url:
                        params.response.url,

                    type:
                        params.type
                }
            );


            console.log(
                "TraceDev Request Completed:",
                request
            );
        }
    );


    /*
     * Resource completely loaded.
     */

    Network.loadingFinished(
        (params: any) => {

            traceStore.finishPageResource(
                params.requestId
            );


            /*
             * Check whether all resources
             * belonging to the current page
             * have finished.
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

                    traceStore
                        .finishPageLoad();
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
                        params.blockedReason
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