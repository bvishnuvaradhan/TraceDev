import * as vscode from "vscode";
import {
    traceStore,
    TraceEvent
} from "../tracing/traceStore";

export class TracePanel {

    public static currentPanel:
        TracePanel | undefined;

    private readonly panel:
        vscode.WebviewPanel;

    private readonly extensionUri:
        vscode.Uri;

    private readonly disposables:
        vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri
    ) {

        this.panel = panel;

        this.extensionUri =
            extensionUri;

        this.panel.webview.html =
            this.getHtml();

        this.disposables.push(
            traceStore.onEvent(
                (event) => {
                    this.sendEvent(event);
                }
            )
        );

        this.panel.onDidDispose(
            () => {
                this.dispose();
            },
            null,
            this.disposables
        );
    }

    public static createOrShow(
        extensionUri: vscode.Uri
    ) {

        const column =
            vscode.ViewColumn.Two;

        if (
            TracePanel.currentPanel
        ) {

            TracePanel.currentPanel
                .panel.reveal(column);

            return;
        }

        const panel =
            vscode.window.createWebviewPanel(
                "tracedev",
                "TraceDev",
                column,
                {
                    enableScripts: true
                }
            );

        TracePanel.currentPanel =
            new TracePanel(
                panel,
                extensionUri
            );
    }

    private sendEvent(
        event: TraceEvent
    ) {

        this.panel.webview.postMessage({
            type: "traceEvent",
            event
        });
    }

    private getHtml(): string {

        return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width,
             initial-scale=1.0"
>

<style>

body {

    font-family:
        var(--vscode-font-family);

    color:
        var(--vscode-foreground);

    background:
        var(--vscode-editor-background);

    padding: 20px;
}

h1 {

    font-size: 22px;

    margin-bottom: 20px;
}

.status {

    padding: 10px;

    border-radius: 6px;

    background:
        var(--vscode-textBlockQuote-background);

    margin-bottom: 20px;
}

.section {

    margin-top: 25px;
}

.event {

    padding: 10px;

    margin: 6px 0;

    border-radius: 5px;

    background:
        var(--vscode-editor-inactiveSelectionBackground);

    font-family: monospace;

    font-size: 13px;
}

.request {

    border-left:
        4px solid
        var(--vscode-charts-blue);
}

.response {

    border-left:
        4px solid
        var(--vscode-charts-green);
}

.console {

    border-left:
        4px solid
        var(--vscode-charts-yellow);
}

.exception {

    border-left:
        4px solid
        var(--vscode-charts-red);
}

</style>

</head>

<body>

<h1>TraceDev</h1>

<div class="status">

    🟢 Browser Connected

</div>

<div class="section">

    <h2>Live Trace</h2>

    <div id="events"></div>

</div>

<script>

const vscode =
    acquireVsCodeApi();

const events =
    document.getElementById(
        "events"
    );

window.addEventListener(
    "message",
    (message) => {

        const data =
            message.data;

        if (
            data.type !==
            "traceEvent"
        ) {

            return;
        }

        addEvent(
            data.event
        );
    }
);


function addEvent(event) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "event " +
        event.type;

    const time =
        new Date(
            event.timestamp
        ).toLocaleTimeString();

    let content = "";

    if (
        event.type ===
        "request"
    ) {

        content =
            "🌐 " +
            event.data.method +
            " " +
            event.data.url;
    }

    else if (
        event.type ===
        "response"
    ) {

        content =
            "📡 " +
            event.data.status +
            " " +
            event.data.url;
    }

    else if (
        event.type ===
        "console"
    ) {

        content =
            "📝 Console: " +
            event.data.type;
    }

    else if (
        event.type ===
        "exception"
    ) {

        content =
            "🔴 " +
            (
                event.data.text ||
                "Runtime exception"
            );
    }

    element.textContent =
        time +
        "  " +
        content;

    events.prepend(
        element
    );
}

</script>

</body>

</html>
`;
    }

    public dispose() {

        TracePanel.currentPanel =
            undefined;

        while (
            this.disposables.length
        ) {

            const disposable =
                this.disposables.pop();

            if (disposable) {
                disposable.dispose();
            }
        }

        this.panel.dispose();
    }
}