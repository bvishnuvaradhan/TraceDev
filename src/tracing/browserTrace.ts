import { BrowserClient } from "../browser/chrome";
import { traceStore } from "./traceStore";

export async function startBrowserTrace(
    client: BrowserClient
) {

    const { Runtime, Network } = client;

    await Runtime.enable();

    await Network.enable();

    Runtime.consoleAPICalled(
        (params: any) => {

            const event =
                traceStore.add(
                    "console",
                    {
                        type: params.type,
                        args: params.args
                    }
                );

            console.log(
                "TraceDev Console Event:",
                event
            );
        }
    );

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
                            params.exceptionDetails
                    }
                );

            console.log(
                "TraceDev Exception Event:",
                event
            );
        }
    );

    Network.requestWillBeSent(
        (params: any) => {

            const request =
                traceStore.startRequest(
                    params.requestId,
                    params.request.method,
                    params.request.url
                );

            traceStore.add(
                "request",
                {
                    requestId:
                        params.requestId,

                    method:
                        params.request.method,

                    url:
                        params.request.url
                }
            );

            console.log(
                "TraceDev Request Started:",
                request
            );
        }
    );

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
                        params.response.url
                }
            );

            console.log(
                "TraceDev Request Completed:",
                request
            );
        }
    );

    console.log(
        "TraceDev: Browser tracing started"
    );
}