import * as vscode from "vscode";

import {
    TracePanel
} from "./ui/tracePanel";

import {
    connectToChrome,
    BrowserClient
} from "./browser/chrome";

import {
    startBrowserTrace
} from "./tracing/browserTrace";

import {
    traceStore
} from "./tracing/traceStore";


let browserClient:
    BrowserClient | undefined;


export function activate(
    context: vscode.ExtensionContext
) {

    console.log(
        "TraceDev activated"
    );

    const startTraceCommand =
        vscode.commands.registerCommand(
            "tracedev.startTrace",
            async () => {

                try {

                    browserClient =
                        await connectToChrome();

                    await startBrowserTrace(
                        browserClient
                    );

                    vscode.window
                        .showInformationMessage(
                            "TraceDev: Browser tracing started"
                        );

                } catch (error) {

                    console.error(
                        "TraceDev:",
                        error
                    );

                    vscode.window
                        .showErrorMessage(
                            "TraceDev: Could not connect to Chrome"
                        );
                }
            }
        );

    const openTraceCommand =
        vscode.commands.registerCommand(
            "tracedev.openTrace",
            () => {

                TracePanel.createOrShow(
                    context.extensionUri
                );
            }
        );

    context.subscriptions.push(
        startTraceCommand
    );

    context.subscriptions.push(
        openTraceCommand
    );

    context.subscriptions.push(
        traceStore.onEvent(
            (event) => {

                console.log(
                    "TraceDev Store Event:",
                    event
                );
            }
        )
    );
}


export function deactivate() {

    if (browserClient) {

        browserClient.close();

        browserClient =
            undefined;
    }


    traceStore.dispose();


    console.log(
        "TraceDev deactivated"
    );
}