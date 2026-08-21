import * as vscode from "vscode";

import {
    traceStore
} from "../tracing/traceStore";

import {
    TraceEvent,
    NetworkTrace
} from "../tracing/traceStoreTypes";

import {
    Trace
} from "../tracing/traceModel";


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


        /*
         * Send existing data when
         * the panel is opened.
         */

        this.sendExistingData();


        /*
         * Listen for new TraceStore events.
         */

        this.disposables.push(
            traceStore.onEvent(
                (event) => {

                    this.handleEvent(
                        event
                    );
                }
            )
        );


        /*
         * Handle panel closing.
         */

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
                .panel.reveal(
                    column
                );

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
                panel
            );
    }


    /*
     * Send existing TraceStore data
     * to the Webview.
     */

    private sendExistingData() {

        const requests:
            NetworkTrace[] =
            traceStore.getRequests();


        const events:
            TraceEvent[] =
            traceStore.getAll();


        const traces:
            Trace[] =
            traceStore.getTraces();


        this.panel.webview.postMessage({

            type:
                "initialData",

            requests,

            events,

            traces
        });
    }


    /*
     * Handle new TraceStore events.
     */

    private handleEvent(
        event: TraceEvent
    ) {

        /*
         * Network events cause
         * the network list to refresh.
         */

        if (
            event.type === "request" ||
            event.type === "response"
        ) {

            this.panel.webview.postMessage({

                type:
                    "networkUpdate",

                requests:
                    traceStore.getRequests(),

                traces:
                    traceStore.getTraces()
            });

            return;
        }


        /*
         * Console and exception events
         * are sent individually.
         */

        this.panel.webview.postMessage({

            type:
                "traceEvent",

            event
        });
    }


    /*
     * Webview HTML.
     */

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

    padding:
        20px;

    margin:
        0;
}


h1 {

    font-size:
        24px;

    margin-bottom:
        20px;
}


h2 {

    font-size:
        15px;

    margin-top:
        28px;

    margin-bottom:
        12px;

    letter-spacing:
        0.5px;
}


/* Browser status */

.status {

    padding:
        12px;

    border-radius:
        7px;

    background:
        var(
            --vscode-textBlockQuote-background
        );

    margin-bottom:
        25px;

    font-size:
        13px;
}


.status-dot {

    display:
        inline-block;

    width:
        9px;

    height:
        9px;

    border-radius:
        50%;

    background:
        #4ade80;

    margin-right:
        8px;
}


/* Page load */

.page-load {

    padding:
        14px;

    margin:
        10px 0;

    border-radius:
        7px;

    background:
        var(
            --vscode-editor-inactiveSelectionBackground
        );

    border-left:
        4px solid #60a5fa;
}


.page-title {

    font-size:
        14px;

    font-weight:
        bold;

    margin-bottom:
        8px;
}


.page-url {

    font-family:
        monospace;

    font-size:
        12px;

    opacity:
        0.8;

    word-break:
        break-all;
}


.page-meta {

    margin-top:
        8px;

    font-size:
        12px;

    opacity:
        0.7;
}


/* Resources */

.resource {

    margin-top:
        8px;

    padding:
        9px;

    border-radius:
        5px;

    background:
        var(
            --vscode-editor-background
        );

    border-left:
        3px solid #4ade80;
}


.resource.failed {

    border-left-color:
        #f87171;
}


.resource-line {

    display:
        flex;

    gap:
        8px;

    align-items:
        center;

    font-family:
        monospace;

    font-size:
        12px;
}


.resource-method {

    font-weight:
        bold;
}


.resource-status {

    margin-left:
        auto;

    font-weight:
        bold;
}


.resource-url {

    margin-top:
        5px;

    font-family:
        monospace;

    font-size:
        11px;

    opacity:
        0.75;

    word-break:
        break-all;
}


.resource-time {

    margin-top:
        5px;

    font-size:
        11px;

    opacity:
        0.65;
}


/* Network */

.network-card {

    padding:
        12px;

    margin:
        7px 0;

    border-radius:
        6px;

    background:
        var(
            --vscode-editor-inactiveSelectionBackground
        );

    border-left:
        4px solid #4ade80;
}


.network-card.failed {

    border-left-color:
        #f87171;
}


.network-main {

    display:
        flex;

    align-items:
        center;

    gap:
        10px;

    font-family:
        monospace;

    font-size:
        13px;
}


.network-status {

    margin-left:
        auto;

    font-weight:
        bold;
}


.network-url {

    margin-top:
        6px;

    font-family:
        monospace;

    font-size:
        11px;

    opacity:
        0.75;

    word-break:
        break-all;
}


.network-meta {

    margin-top:
        6px;

    font-size:
        11px;

    opacity:
        0.65;
}


/* Console */

.console-card {

    padding:
        10px;

    margin:
        7px 0;

    border-radius:
        6px;

    background:
        var(
            --vscode-editor-inactiveSelectionBackground
        );

    border-left:
        4px solid #facc15;

    font-family:
        monospace;

    font-size:
        12px;
}


/* Errors */

.error-card {

    padding:
        10px;

    margin:
        7px 0;

    border-radius:
        6px;

    background:
        var(
            --vscode-editor-inactiveSelectionBackground
        );

    border-left:
        4px solid #f87171;

    font-family:
        monospace;

    font-size:
        12px;
}


.empty {

    opacity:
        0.5;

    padding:
        10px 0;
}


</style>

</head>


<body>


<h1>TraceDev</h1>


<div class="status">

    <span class="status-dot"></span>

    Browser Connected

</div>


<h2>PAGE LOADS</h2>

<div id="pageLoads">

    <div class="empty">

        Waiting for page loads...

    </div>

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


const pageLoads =
    document.getElementById(
        "pageLoads"
    );


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


let traces = [];

let requests = [];

let consoleEvents = [];

let errorEvents = [];



/*
 * Receive messages from
 * the TraceDev extension.
 */

window.addEventListener(
    "message",
    (message) => {

        const data =
            message.data;


        /*
         * Initial data.
         */

        if (
            data.type ===
            "initialData"
        ) {

            traces =
                data.traces || [];


            requests =
                data.requests || [];


            const events =
                data.events || [];


            consoleEvents =
                events.filter(
                    event =>
                        event.type ===
                        "console"
                );


            errorEvents =
                events.filter(
                    event =>
                        event.type ===
                        "exception"
                );


            renderAll();

            return;
        }


        /*
         * Network update.
         */

        if (
            data.type ===
            "networkUpdate"
        ) {

            requests =
                data.requests || [];


            traces =
                data.traces || [];


            renderPageLoads();

            renderNetwork();

            return;
        }


        /*
         * New console / exception.
         */

        if (
            data.type ===
            "traceEvent"
        ) {

            const event =
                data.event;


            if (
                event.type ===
                "console"
            ) {

                consoleEvents.push(
                    event
                );

                renderConsole();
            }


            if (
                event.type ===
                "exception"
            ) {

                errorEvents.push(
                    event
                );

                renderErrors();
            }
        }

    }
);



function renderAll() {

    renderPageLoads();

    renderNetwork();

    renderConsole();

    renderErrors();
}



/*
 * PAGE LOADS
 */

function renderPageLoads() {

    if (
        traces.length === 0
    ) {

        pageLoads.innerHTML =
            '<div class="empty">' +
            'Waiting for page loads...' +
            '</div>';

        return;
    }


    pageLoads.innerHTML =
        "";


    [...traces]
        .reverse()
        .forEach(
            trace => {

                if (
                    trace.kind !==
                    "page-load"
                ) {

                    return;
                }


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "page-load";


                const duration =
                    trace.duration !==
                    undefined

                        ? trace.duration +
                          " ms"

                        : "loading";


                const start =
                    new Date(
                        trace.startTime
                    )
                    .toLocaleTimeString();


                card.innerHTML =

                    '<div class="page-title">' +

                        '🌐 PAGE LOAD' +

                    '</div>' +


                    '<div class="page-url">' +

                        escapeHtml(
                            trace.name
                        ) +

                    '</div>' +


                    '<div class="page-meta">' +

                        start +

                        ' • ' +

                        duration +

                    '</div>';


                /*
                 * Resources.
                 */

                if (
                    trace.resources &&
                    trace.resources.length > 0
                ) {

                    trace.resources.forEach(
                        resource => {

                            const element =
                                document.createElement(
                                    "div"
                                );


                            element.className =
                                "resource " +
                                (
                                    resource.failed
                                        ? "failed"
                                        : ""
                                );


                            const status =
                                resource.status ??
                                "…";


                            const duration =
                                resource.duration !==
                                undefined

                                    ? resource.duration +
                                      " ms"

                                    : "loading";


                            const icon =
                                getResourceIcon(
                                    resource.type
                                );


                            element.innerHTML =

                                '<div class="resource-line">' +

                                    '<span>' +
                                        icon +
                                    '</span>' +

                                    '<span class="resource-method">' +

                                        escapeHtml(
                                            resource.method
                                        ) +

                                    '</span>' +

                                    '<span class="resource-status">' +

                                        status +

                                    '</span>' +

                                '</div>' +


                                '<div class="resource-url">' +

                                    escapeHtml(
                                        resource.url
                                    ) +

                                '</div>' +


                                '<div class="resource-time">' +

                                    duration +

                                    ' • ' +

                                    (
                                        resource.failed
                                            ? "❌ Failed"
                                            : "✅ Success"
                                    ) +

                                '</div>';


                            card.appendChild(
                                element
                            );
                        }
                    );
                }


                pageLoads.appendChild(
                    card
                );
            }
        );
}



/*
 * NETWORK
 */

function renderNetwork() {

    if (
        requests.length === 0
    ) {

        network.innerHTML =
            '<div class="empty">' +
            'Waiting for network activity...' +
            '</div>';

        return;
    }


    network.innerHTML =
        "";


    [...requests]
        .reverse()
        .forEach(
            request => {

                /*
                 * Don't duplicate
                 * page-load resources
                 * in the general network
                 * section.
                 */

                const isPageResource =
                    traces.some(
                        trace =>
                            trace.resources.some(
                                resource =>
                                    resource.requestId ===
                                    request.requestId
                            )
                    );


                if (isPageResource) {
                    return;
                }


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "network-card " +

                    (
                        request.failed
                            ? "failed"
                            : ""
                    );


                const status =
                    request.status ??
                    "…";


                const duration =
                    request.duration !==
                    undefined

                        ? request.duration +
                          " ms"

                        : "pending";


                card.innerHTML =

                    '<div class="network-main">' +

                        '<span>' +

                            escapeHtml(
                                request.method
                            ) +

                        '</span>' +


                        '<span class="network-status">' +

                            status +

                        '</span>' +

                    '</div>' +


                    '<div class="network-url">' +

                        escapeHtml(
                            request.url
                        ) +

                    '</div>' +


                    '<div class="network-meta">' +

                        duration +

                        ' • ' +

                        (
                            request.failed
                                ? "❌ Failed"
                                : "✅ Success"
                        ) +

                    '</div>';


                network.appendChild(
                    card
                );
            }
        );
}



/*
 * CONSOLE
 */

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


                const time =
                    new Date(
                        event.timestamp
                    )
                    .toLocaleTimeString();


                card.textContent =

                    time +

                    " • 📝 " +

                    event.data.type;


                consoleContainer
                    .appendChild(
                        card
                    );
            }
        );
}



/*
 * ERRORS
 */

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


    errors.innerHTML =
        "";


    [...errorEvents]
        .reverse()
        .forEach(
            event => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "error-card";


                const time =
                    new Date(
                        event.timestamp
                    )
                    .toLocaleTimeString();


                card.textContent =

                    time +

                    " • 🔴 " +

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



/*
 * Resource icons.
 */

function getResourceIcon(
    type
) {

    switch (type) {

        case "Document":
            return "📄";

        case "Script":
            return "⚙️";

        case "Stylesheet":
            return "🎨";

        case "Image":
            return "🖼️";

        case "Font":
            return "🔤";

        default:
            return "🌐";
    }
}



/*
 * Prevent HTML injection.
 */

function escapeHtml(
    value
) {

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