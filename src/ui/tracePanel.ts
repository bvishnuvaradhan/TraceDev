import * as vscode from "vscode";

import {
    traceStore,
    TraceEvent,
    NetworkTrace
} from "../tracing/traceStore";

export class TracePanel {

    public static currentPanel:
        TracePanel | undefined;

    private readonly panel:
        vscode.WebviewPanel;

    private readonly disposables:
        vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel
    ) {

        this.panel = panel;

        this.panel.webview.html =
            this.getHtml();

        // Send existing data when panel opens
        this.sendExistingData();

        // Listen for new trace events
        this.disposables.push(
            traceStore.onEvent(
                (event) => {
                    this.handleEvent(event);
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

        if (TracePanel.currentPanel) {

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
            new TracePanel(panel);
    }

    private sendExistingData() {

        const requests =
            traceStore.getRequests();

        const events =
            traceStore.getAll();

        this.panel.webview.postMessage({
            type: "initialData",
            requests,
            events
        });
    }

    private handleEvent(
        event: TraceEvent
    ) {

        if (
            event.type === "request" ||
            event.type === "response"
        ) {

            this.panel.webview.postMessage({
                type: "networkUpdate",
                requests:
                    traceStore.getRequests()
            });

            return;
        }

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

    font-size: 24px;

    margin-bottom: 20px;
}

h2 {

    font-size: 16px;

    margin-top: 28px;

    margin-bottom: 12px;
}

.status {

    padding: 12px;

    border-radius: 7px;

    background:
        var(--vscode-textBlockQuote-background);

    margin-bottom: 25px;

    font-size: 14px;
}

.status-dot {

    display: inline-block;

    width: 10px;

    height: 10px;

    border-radius: 50%;

    background: #4ade80;

    margin-right: 8px;
}

.network-card {

    padding: 13px;

    margin: 8px 0;

    border-radius: 6px;

    background:
        var(--vscode-editor-inactiveSelectionBackground);

    border-left: 4px solid #4ade80;

    cursor: pointer;
}

.network-card.failed {

    border-left-color: #f87171;
}

.network-card.pending {

    border-left-color: #facc15;
}

.network-main {

    display: flex;

    align-items: center;

    gap: 10px;

    font-family: monospace;

    font-size: 14px;
}

.method {

    font-weight: bold;
}

.status-code {

    margin-left: auto;

    font-weight: bold;
}

.url {

    margin-top: 7px;

    font-family: monospace;

    font-size: 12px;

    opacity: 0.8;

    word-break: break-all;
}

.meta {

    margin-top: 7px;

    font-size: 12px;

    opacity: 0.7;
}

.console-card {

    padding: 11px;

    margin: 7px 0;

    border-radius: 6px;

    background:
        var(--vscode-editor-inactiveSelectionBackground);

    border-left: 4px solid #facc15;

    font-family: monospace;

    font-size: 13px;
}

.exception-card {

    padding: 11px;

    margin: 7px 0;

    border-radius: 6px;

    background:
        var(--vscode-editor-inactiveSelectionBackground);

    border-left: 4px solid #f87171;

    font-family: monospace;

    font-size: 13px;
}

.empty {

    opacity: 0.5;

    padding: 10px 0;
}

</style>

</head>

<body>

<h1>TraceDev</h1>

<div class="status">

    <span class="status-dot"></span>

    Browser Connected

</div>

<h2>NETWORK</h2>

<div id="network">

    <div class="empty">
        Waiting for network activity...
    </div>

</div>

<h2>CONSOLE</h2>

<div id="console">

    <div class="empty">
        No console events yet.
    </div>

</div>

<h2>ERRORS</h2>

<div id="errors">

    <div class="empty">
        No runtime errors.
    </div>

</div>

<script>

const vscode =
    acquireVsCodeApi();

const network =
    document.getElementById(
        "network"
    );

const consoleContainer =
    document.getElementById(
        "console"
    );

const errors =
    document.getElementById(
        "errors"
    );

let requests = [];

let consoleEvents = [];

let errorEvents = [];


window.addEventListener(
    "message",
    (message) => {

        const data =
            message.data;

        if (
            data.type ===
            "initialData"
        ) {

            requests =
                data.requests || [];

            consoleEvents =
                (data.events || [])
                    .filter(
                        event =>
                            event.type ===
                            "console"
                    );

            errorEvents =
                (data.events || [])
                    .filter(
                        event =>
                            event.type ===
                                "exception"
                    );

            renderAll();

            return;
        }

        if (
            data.type ===
            "networkUpdate"
        ) {

            requests =
                data.requests || [];

            renderNetwork();

            return;
        }

        if (
            data.type ===
            "traceEvent"
        ) {

            if (
                data.event.type ===
                "console"
            ) {

                consoleEvents.push(
                    data.event
                );

                renderConsole();
            }

            if (
                data.event.type ===
                "exception"
            ) {

                errorEvents.push(
                    data.event
                );

                renderErrors();
            }
        }
    }
);


function renderAll() {

    renderNetwork();

    renderConsole();

    renderErrors();
}


function renderNetwork() {

    if (requests.length === 0) {

        network.innerHTML =
            '<div class="empty">' +
            'Waiting for network activity...' +
            '</div>';

        return;
    }

    network.innerHTML = "";

    [...requests]
        .reverse()
        .forEach(
            request => {

                const card =
                    document.createElement(
                        "div"
                    );

                const failed =
                    request.failed;

                const pending =
                    !request.status;

                card.className =
                    "network-card " +
                    (
                        failed
                            ? "failed"
                            : pending
                                ? "pending"
                                : ""
                    );

                const status =
                    request.status
                        ? request.status
                        : "…";

                const duration =
                    request.duration !==
                    undefined
                        ? request.duration +
                          " ms"
                        : "pending";

                card.innerHTML =

                    '<div class="network-main">' +

                        '<span class="method">' +
                            escapeHtml(
                                request.method
                            ) +
                        '</span>' +

                        '<span class="status-code">' +
                            status +
                        '</span>' +

                    '</div>' +

                    '<div class="url">' +
                        escapeHtml(
                            request.url
                        ) +
                    '</div>' +

                    '<div class="meta">' +
                        duration +
                        ' • ' +
                        (
                            failed
                                ? "❌ Failed"
                                : pending
                                    ? "⏳ Pending"
                                    : "✅ Success"
                        ) +
                    '</div>';

                network.appendChild(
                    card
                );
            }
        );
}


function renderConsole() {

    if (
        consoleEvents.length === 0
    ) {

        consoleContainer.innerHTML =
            '<div class="empty">' +
            'No console events yet.' +
            '</div>';

        return;
    }

    consoleContainer.innerHTML =
        "";

    [...consoleEvents]
        .reverse()
        .forEach(
            event => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "console-card";

                card.textContent =
                    "📝 " +
                    event.data.type;

                consoleContainer
                    .appendChild(card);
            }
        );
}


function renderErrors() {

    if (
        errorEvents.length === 0
    ) {

        errors.innerHTML =
            '<div class="empty">' +
            'No runtime errors.' +
            '</div>';

        return;
    }

    errors.innerHTML = "";

    [...errorEvents]
        .reverse()
        .forEach(
            event => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "exception-card";

                card.textContent =
                    "🔴 " +
                    (
                        event.data.text ||
                        "Runtime exception"
                    );

                errors.appendChild(
                    card
                );
            }
        );
}


function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
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