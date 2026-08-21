import * as vscode from "vscode";
import {
    connectToChrome,
    BrowserClient
} from "./browser/chrome";
import { startBrowserTrace } from "./tracing/browserTrace";

let browserClient: BrowserClient | undefined;

export function activate(context: vscode.ExtensionContext) {

    console.log("TraceDev activated");

    const startTraceCommand = vscode.commands.registerCommand(
        "tracedev.startTrace",
        async () => {

            try {

                browserClient = await connectToChrome();

                await startBrowserTrace(browserClient);

                vscode.window.showInformationMessage(
                    "TraceDev: Browser tracing started"
                );

            } catch (error) {

                console.error("TraceDev:", error);

                vscode.window.showErrorMessage(
                    "TraceDev: Could not connect to Chrome"
                );
            }
        }
    );

    context.subscriptions.push(startTraceCommand);
}

export function deactivate() {

    if (browserClient) {
        browserClient.close();
        browserClient = undefined;
    }

    console.log("TraceDev deactivated");
}