import * as vscode from "vscode";
import { traceStore } from "../tracing/traceStore";

export class TracePanel {

    private static currentPanel:
        TracePanel | undefined;

    private readonly panel:
        vscode.WebviewPanel;

    private readonly disposables:
        vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel
    ) {

        this.panel = panel;

        this.panel.webview.options = {
            enableScripts: true
        };

        this.panel.webview.html =
            this.getHtml();


        /*
         * Send the current trace data whenever
         * the store changes.
         */
        this.disposables.push(

            traceStore.onEvent(
                (event) => {

                    console.log(
                        "TraceDev UI Event:",
                        event
                    );

                    this.sendSnapshot();
                }
            )
        );


        /*
         * If the panel becomes visible again,
         * refresh the UI.
         */
        this.disposables.push(

            this.panel.onDidChangeViewState(
                () => {

                    if (
                        this.panel.visible
                    ) {

                        this.sendSnapshot();
                    }
                }
            )
        );


        /*
         * Dispose everything when the panel closes.
         */
        this.disposables.push(

            this.panel.onDidDispose(
                () => {

                    this.dispose();
                }
            )
        );


        /*
         * Give the Webview a moment to load,
         * then send existing data.
         */
        setTimeout(
            () => {

                this.sendSnapshot();

            },
            300
        );
    }


    /*
     * Open TraceDev panel.
     */
    public static createOrShow(
        extensionUri: vscode.Uri
    ): void {

        const column =
            vscode.ViewColumn.One;


        /*
         * If panel already exists,
         * just reveal it.
         */
        if (
            TracePanel.currentPanel
        ) {

            TracePanel.currentPanel.panel.reveal(
                column
            );

            TracePanel.currentPanel.sendSnapshot();

            return;
        }


        /*
         * Create Webview panel.
         */
        const panel =
            vscode.window.createWebviewPanel(

                "tracedevTrace",

                "TraceDev",

                column,

                {
                    enableScripts: true,

                    retainContextWhenHidden: true
                }
            );


        TracePanel.currentPanel =
            new TracePanel(panel);
    }


    /*
     * Send complete current state
     * to the Webview.
     */
    private sendSnapshot(): void {

        try {

            const requests =
                traceStore.getRequests();

            const events =
                traceStore.getAll();

            const traces =
                traceStore.getTraces();


            console.log(
                "TraceDev UI Data:",
                {
                    requests,
                    events,
                    traces
                }
            );


            this.panel.webview.postMessage({

                type: "snapshot",

                requests,

                events,

                traces
            });

        } catch (error) {

            console.error(
                "TraceDev UI Snapshot Error:",
                error
            );
        }
    }


    /*
     * Generate Webview HTML.
     */
    private getHtml(): string {

        const nonce =
            getNonce();


        return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<meta
    http-equiv="Content-Security-Policy"
    content="
        default-src 'none';
        style-src 'unsafe-inline';
        script-src 'nonce-${nonce}';
    "
>


<title>TraceDev</title>


<style>

    * {
        box-sizing: border-box;
    }


    body {

        margin: 0;

        padding: 28px;

        background: #111111;

        color: #dddddd;

        font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

        font-size: 14px;
    }


    h1 {

        margin: 0 0 26px 0;

        font-size: 30px;

        color: #eeeeee;
    }


    h2 {

        margin-top: 34px;

        margin-bottom: 16px;

        font-size: 19px;

        color: #eeeeee;

        letter-spacing: 0.3px;
    }


    .connection {

        display: flex;

        align-items: center;

        gap: 10px;

        padding: 16px;

        margin-bottom: 30px;

        background: #222222;

        border-radius: 8px;

        font-size: 16px;
    }


    .connection-dot {

        width: 14px;

        height: 14px;

        border-radius: 50%;

        background: #48e08a;

        box-shadow:
            0 0 8px rgba(
                72,
                224,
                138,
                0.5
            );
    }


    .empty {

        color: #777777;

        padding: 10px 0;

        font-size: 14px;
    }


    .page-load {

        margin-bottom: 22px;

        padding: 16px;

        background: #1d2428;

        border-left:
            5px solid #4db6ff;

        border-radius: 7px;
    }


    .page-load-title {

        font-size: 16px;

        font-weight: 600;

        margin-bottom: 8px;
    }


    .page-load-url {

        color: #8fcfff;

        word-break: break-all;

        margin-bottom: 7px;
    }


    .page-load-meta {

        color: #999999;

        font-size: 12px;
    }


    .network-card {

        margin-bottom: 12px;

        padding: 16px;

        background: #19343f;

        border-left:
            5px solid #45dc91;

        border-radius: 7px;
    }


    .network-card.failed {

        border-left-color:
            #ff6570;
    }


    .network-header {

        display: flex;

        align-items: center;

        gap: 12px;

        margin-bottom: 8px;
    }


    .method {

        font-weight: 700;

        color: #eeeeee;

        font-size: 15px;
    }


    .status {

        font-weight: 700;

        color: #eeeeee;

        font-size: 15px;
    }


    .network-url {

        color: #9bd7ff;

        word-break: break-all;

        margin-bottom: 9px;

        font-size: 14px;
    }


    .network-meta {

        margin-top: 6px;

        font-size: 12px;

        color: #999999;

        line-height: 1.7;
    }


    .network-initiator {

        margin-top: 10px;

        padding: 10px;

        background: #142a32;

        border-radius: 5px;

        font-size: 12px;

        color: #aaaaaa;
    }


    .initiator-label {

        color: #eeeeee;

        font-weight: 600;

        margin-bottom: 5px;
    }


    .initiator-url {

        color: #8fcfff;

        word-break: break-all;
    }


    .console-card {

        margin-bottom: 10px;

        padding: 14px 16px;

        background: #302c18;

        border-left:
            5px solid #f2c94c;

        border-radius: 7px;
    }


    .console-header {

        display: flex;

        align-items: center;

        gap: 10px;

        margin-bottom: 7px;
    }


    .console-level {

        font-weight: 700;

        color: #f2c94c;
    }


    .console-time {

        color: #999999;

        font-size: 12px;
    }


    .console-message {

        color: #dddddd;

        white-space: pre-wrap;

        word-break: break-word;
    }


    .error-card {

        margin-bottom: 10px;

        padding: 14px 16px;

        background: #351c20;

        border-left:
            5px solid #ff6570;

        border-radius: 7px;
    }


    .error-title {

        font-weight: 700;

        color: #ff7d86;

        margin-bottom: 7px;
    }


    .error-message {

        color: #dddddd;

        white-space: pre-wrap;

        word-break: break-word;
    }


    .frontend-badge {

        display: inline-block;

        padding: 3px 7px;

        margin-left: 8px;

        border-radius: 4px;

        background: #293d4b;

        color: #9bd7ff;

        font-size: 10px;

        font-weight: 600;
    }


    .backend-badge {

        display: inline-block;

        padding: 3px 7px;

        margin-left: 8px;

        border-radius: 4px;

        background: #3c3525;

        color: #f2c94c;

        font-size: 10px;

        font-weight: 600;
    }


    .section-count {

        color: #777777;

        font-size: 12px;

        font-weight: normal;

        margin-left: 8px;
    }


    a {

        color: inherit;

        text-decoration: none;
    }

</style>

</head>


<body>


<h1>TraceDev</h1>


<div class="connection">

    <div class="connection-dot"></div>

    <span>
        Browser Connected
    </span>

</div>


<section>

    <h2>
        PAGE LOADS
        <span
            id="pageLoadCount"
            class="section-count"
        ></span>
    </h2>

    <div id="pageLoads">

        <div class="empty">
            Waiting for page loads...
        </div>

    </div>

</section>


<section>

    <h2>
        NETWORK
        <span
            id="networkCount"
            class="section-count"
        ></span>
    </h2>

    <div id="network">

        <div class="empty">
            Waiting for network activity...
        </div>

    </div>

</section>


<section>

    <h2>
        CONSOLE
        <span
            id="consoleCount"
            class="section-count"
        ></span>
    </h2>

    <div id="console">

        <div class="empty">
            No console events yet.
        </div>

    </div>

</section>


<section>

    <h2>
        ERRORS
        <span
            id="errorCount"
            class="section-count"
        ></span>
    </h2>

    <div id="errors">

        <div class="empty">
            No runtime errors.
        </div>

    </div>

</section>


<script nonce="${nonce}">

(function () {

    "use strict";


    /*
     * Current UI state.
     */
    let requests = [];

    let events = [];

    let traces = [];


    /*
     * DOM helpers.
     */
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


    const pageLoadCount =
        document.getElementById(
            "pageLoadCount"
        );

    const networkCount =
        document.getElementById(
            "networkCount"
        );

    const consoleCount =
        document.getElementById(
            "consoleCount"
        );

    const errorCount =
        document.getElementById(
            "errorCount"
        );


    /*
     * Escape HTML.
     */
    function escapeHtml(
        value
    ) {

        if (
            value === undefined ||
            value === null
        ) {

            return "";
        }


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


    /*
     * Convert timestamp into
     * local time.
     */
    function formatTime(
        timestamp
    ) {

        if (
            !timestamp
        ) {

            return "";
        }


        try {

            return new Date(
                Number(timestamp)
            ).toLocaleTimeString();

        } catch {

            return "";
        }
    }


    /*
     * Format milliseconds.
     */
    function formatDuration(
        value
    ) {

        if (
            value === undefined ||
            value === null
        ) {

            return "—";
        }


        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return "—";
        }


        return Math.max(
            0,
            Math.round(number)
        ) + " ms";
    }


    /*
     * Get object property safely.
     */
    function get(
        object,
        key
    ) {

        if (
            !object
        ) {

            return undefined;
        }


        return object[key];
    }


    /*
     * Get event data.
     */
    function eventData(
        event
    ) {

        return (
            event &&
            event.data
        ) || {};
    }


    /*
     * Determine request URL.
     */
    function requestUrl(
        request
    ) {

        const data =
            eventData(request);


        return (
            data.url ||
            request.url ||
            ""
        );
    }


    /*
     * Determine request method.
     */
    function requestMethod(
        request
    ) {

        const data =
            eventData(request);


        return (
            data.method ||
            request.method ||
            "GET"
        );
    }


    /*
     * Determine request status.
     */
    function requestStatus(
        request
    ) {

        const data =
            eventData(request);


        return (
            data.status ??
            request.status ??
            ""
        );
    }


    /*
     * Determine request failure.
     */
    function requestFailed(
        request
    ) {

        const data =
            eventData(request);


        if (
            data.failed === true ||
            request.failed === true
        ) {

            return true;
        }


        const status =
            Number(
                requestStatus(
                    request
                )
            );


        return (
            status >= 400
        );
    }


    /*
     * Determine duration.
     */
    function requestDuration(
        request
    ) {

        const data =
            eventData(request);


        if (
            data.duration !== undefined
        ) {

            return data.duration;
        }


        if (
            request.duration !== undefined
        ) {

            return request.duration;
        }


        const start =
            data.startTime ??
            request.startTime;


        const end =
            data.endTime ??
            data.completedTime ??
            request.endTime ??
            request.completedTime;


        if (
            start !== undefined &&
            end !== undefined
        ) {

            return Number(end) -
                   Number(start);
        }


        return undefined;
    }


    /*
     * Find initiator.
     */
    function getInitiator(
        request
    ) {

        const data =
            eventData(request);


        return (
            data.initiator ||
            request.initiator
        );
    }


    /*
     * Get initiator type.
     */
    function initiatorType(
        initiator
    ) {

        if (
            !initiator
        ) {

            return "";
        }


        return (
            initiator.type ||
            ""
        );
    }


    /*
     * Get initiator URL.
     */
    function initiatorUrl(
        initiator
    ) {

        if (
            !initiator
        ) {

            return "";
        }


        return (
            initiator.url ||
            ""
        );
    }


    /*
     * Determine frontend/backend.
     */
    function getLayer(
        url
    ) {

        if (
            !url
        ) {

            return "";
        }


        const value =
            String(url)
                .toLowerCase();


        if (
            value.includes(
                "/api/"
            )
        ) {

            return "BACKEND";
        }


        if (
            value.endsWith(
                ".js"
            ) ||
            value.endsWith(
                ".css"
            ) ||
            value.endsWith(
                ".html"
            ) ||
            value.endsWith(
                "/"
            )
        ) {

            return "FRONTEND";
        }


        return "";
    }


    /*
     * Render Page Loads.
     */
    function renderPageLoads() {

        const pageRequests =
            requests.filter(
                function (request) {

                    const url =
                        requestUrl(
                            request
                        );


                    return (
                        requestMethod(
                            request
                        ) === "GET" &&
                        (
                            url.endsWith("/") ||
                            url.endsWith(".html")
                        )
                    );
                }
            );


        if (
            pageRequests.length === 0
        ) {

            pageLoads.innerHTML =

                '<div class="empty">' +
                'Waiting for page loads...' +
                '</div>';

            pageLoadCount.textContent =
                "";

            return;
        }


        pageLoadCount.textContent =
            "(" +
            pageRequests.length +
            ")";


        pageLoads.innerHTML =
            pageRequests
                .map(
                    function (request) {

                        const url =
                            requestUrl(
                                request
                            );


                        const status =
                            requestStatus(
                                request
                            );


                        const duration =
                            requestDuration(
                                request
                            );


                        const failed =
                            requestFailed(
                                request
                            );


                        return (

                            '<div class="page-load">' +

                                '<div class="page-load-title">' +

                                    '🌐 PAGE LOAD' +

                                '</div>' +

                                '<div class="page-load-url">' +

                                    escapeHtml(
                                        url
                                    ) +

                                '</div>' +

                                '<div class="page-load-meta">' +

                                    formatTime(
                                        request.timestamp ||
                                        request.startTime
                                    ) +

                                    ' • ' +

                                    formatDuration(
                                        duration
                                    ) +

                                    ' • ' +

                                    escapeHtml(
                                        status
                                            ? String(status)
                                            : ""
                                    ) +

                                    ' ' +

                                    (
                                        failed
                                            ? '❌ Failed'
                                            : '✅ Success'
                                    ) +

                                '</div>' +

                            '</div>'
                        );
                    }
                )
                .join("");
    }


    /*
     * Render Network.
     */
    function renderNetwork() {

        if (
            requests.length === 0
        ) {

            network.innerHTML =

                '<div class="empty">' +
                'Waiting for network activity...' +
                '</div>';

            networkCount.textContent =
                "";

            return;
        }


        networkCount.textContent =
            "(" +
            requests.length +
            ")";


        network.innerHTML =
            requests
                .slice()
                .reverse()
                .map(
                    function (request) {

                        const method =
                            requestMethod(
                                request
                            );


                        const url =
                            requestUrl(
                                request
                            );


                        const status =
                            requestStatus(
                                request
                            );


                        const duration =
                            requestDuration(
                                request
                            );


                        const failed =
                            requestFailed(
                                request
                            );


                        const initiator =
                            getInitiator(
                                request
                            );


                        const layer =
                            getLayer(
                                url
                            );


                        let initiatorHtml =
                            "";


                        if (
                            initiator
                        ) {

                            const type =
                                initiatorType(
                                    initiator
                                );


                            const sourceUrl =
                                initiatorUrl(
                                    initiator
                                );


                            let location =
                                "";


                            if (
                                initiator.lineNumber !== undefined
                            ) {

                                location =
                                    ":" +
                                    (
                                        Number(
                                            initiator.lineNumber
                                        ) + 1
                                    );


                                if (
                                    initiator.columnNumber !== undefined
                                ) {

                                    location +=
                                        ":" +
                                        (
                                            Number(
                                                initiator.columnNumber
                                            ) + 1
                                        );
                                }
                            }


                            initiatorHtml =

                                '<div class="network-initiator">' +

                                    '<div class="initiator-label">' +

                                        'Initiator: ' +

                                        escapeHtml(
                                            type ||
                                            "unknown"
                                        ) +

                                    '</div>' +

                                    (
                                        sourceUrl

                                            ?

                                            '<div class="initiator-url">' +

                                                escapeHtml(
                                                    sourceUrl
                                                ) +

                                                escapeHtml(
                                                    location
                                                ) +

                                            '</div>'

                                            :

                                            ''
                                    ) +

                                '</div>';
                        }


                        return (

                            '<div class="network-card ' +

                                (
                                    failed
                                        ? "failed"
                                        : ""
                                ) +

                            '">' +

                                '<div class="network-header">' +

                                    '<span class="method">' +

                                        escapeHtml(
                                            method
                                        ) +

                                    '</span>' +

                                    '<span class="status">' +

                                        escapeHtml(
                                            status
                                                ? String(status)
                                                : "—"
                                        ) +

                                    '</span>' +

                                    (
                                        layer === "FRONTEND"

                                            ?

                                            '<span class="frontend-badge">' +
                                            'FRONTEND' +
                                            '</span>'

                                            :

                                        layer === "BACKEND"

                                            ?

                                            '<span class="backend-badge">' +
                                            'BACKEND' +
                                            '</span>'

                                            :

                                            ''
                                    ) +

                                '</div>' +

                                '<div class="network-url">' +

                                    escapeHtml(
                                        url
                                    ) +

                                '</div>' +

                                '<div class="network-meta">' +

                                    'Started: ' +

                                    formatTime(
                                        get(
                                            eventData(request),
                                            "startTime"
                                        ) ||
                                        request.startTime
                                    ) +

                                    ' • Completed: ' +

                                    formatTime(
                                        get(
                                            eventData(request),
                                            "endTime"
                                        ) ||
                                        request.endTime ||
                                        request.completedTime
                                    ) +

                                    ' • Duration: ' +

                                    formatDuration(
                                        duration
                                    ) +

                                    ' • ' +

                                    (
                                        failed
                                            ? '❌ Failed'
                                            : '✅ Success'
                                    ) +

                                '</div>' +

                                initiatorHtml +

                            '</div>'
                        );
                    }
                )
                .join("");
    }


    /*
     * Extract console events.
     */
    function getConsoleEvents() {

        return events.filter(
            function (event) {

                return (
                    event &&
                    event.type === "console"
                );
            }
        );
    }


    /*
     * Render Console.
     */
    function renderConsole() {

        const consoleEvents =
            getConsoleEvents();


        if (
            consoleEvents.length === 0
        ) {

            consoleContainer.innerHTML =

                '<div class="empty">' +
                'No console events yet.' +
                '</div>';

            consoleCount.textContent =
                "";

            return;
        }


        consoleCount.textContent =
            "(" +
            consoleEvents.length +
            ")";


        consoleContainer.innerHTML =
            consoleEvents
                .slice()
                .reverse()
                .map(
                    function (event) {

                        const data =
                            eventData(
                                event
                            );


                        const level =
                            data.type ||
                            data.level ||
                            "log";


                        const values =
                            data.values ||
                            data.args ||
                            [];


                        let message =
                            "";


                        if (
                            Array.isArray(values)
                        ) {

                            message =
                                values
                                    .map(
                                        function (value) {

                                            if (
                                                typeof value ===
                                                "object"
                                            ) {

                                                try {

                                                    return JSON.stringify(
                                                        value
                                                    );

                                                } catch {

                                                    return String(
                                                        value
                                                    );
                                                }
                                            }


                                            return String(
                                                value
                                            );
                                        }
                                    )
                                    .join(" ");

                        } else {

                            message =
                                String(
                                    values
                                );
                        }


                        return (

                            '<div class="console-card">' +

                                '<div class="console-header">' +

                                    '<span class="console-level">' +

                                        escapeHtml(
                                            String(
                                                level
                                            ).toUpperCase()
                                        ) +

                                    '</span>' +

                                    '<span class="console-time">' +

                                        formatTime(
                                            event.timestamp
                                        ) +

                                    '</span>' +

                                '</div>' +

                                '<div class="console-message">' +

                                    escapeHtml(
                                        message
                                    ) +

                                '</div>' +

                            '</div>'
                        );
                    }
                )
                .join("");
    }


    /*
     * Render Errors.
     */
    function renderErrors() {

        const errorEvents =
            events.filter(
                function (event) {

                    if (
                        !event
                    ) {

                        return false;
                    }


                    if (
                        event.type === "error"
                    ) {

                        return true;
                    }


                    if (
                        event.type === "console"
                    ) {

                        const data =
                            eventData(
                                event
                            );


                        const level =
                            String(
                                data.type ||
                                data.level ||
                                ""
                            ).toLowerCase();


                        return (
                            level === "error"
                        );
                    }


                    return false;
                }
            );


        if (
            errorEvents.length === 0
        ) {

            errors.innerHTML =

                '<div class="empty">' +
                'No runtime errors.' +
                '</div>';

            errorCount.textContent =
                "";

            return;
        }


        errorCount.textContent =
            "(" +
            errorEvents.length +
            ")";


        errors.innerHTML =
            errorEvents
                .slice()
                .reverse()
                .map(
                    function (event) {

                        const data =
                            eventData(
                                event
                            );


                        const values =
                            data.values ||
                            data.args ||
                            data.message ||
                            "";


                        let message;


                        if (
                            Array.isArray(values)
                        ) {

                            message =
                                values
                                    .map(
                                        function (value) {

                                            if (
                                                typeof value ===
                                                "object"
                                            ) {

                                                try {

                                                    return JSON.stringify(
                                                        value
                                                    );

                                                } catch {

                                                    return String(
                                                        value
                                                    );
                                                }
                                            }


                                            return String(
                                                value
                                            );
                                        }
                                    )
                                    .join(" ");

                        } else {

                            message =
                                String(
                                    values
                                );
                        }


                        return (

                            '<div class="error-card">' +

                                '<div class="error-title">' +

                                    'Runtime Error • ' +

                                    formatTime(
                                        event.timestamp
                                    ) +

                                '</div>' +

                                '<div class="error-message">' +

                                    escapeHtml(
                                        message
                                    ) +

                                '</div>' +

                            '</div>'
                        );
                    }
                )
                .join("");
    }


    /*
     * Render everything.
     */
    function render() {

        renderPageLoads();

        renderNetwork();

        renderConsole();

        renderErrors();
    }


    /*
     * Receive messages from extension.
     */
    window.addEventListener(
        "message",
        function (event) {

            const message =
                event.data;


            if (
                !message
            ) {

                return;
            }


            console.log(
                "TraceDev Webview Message:",
                message.type
            );


            if (
                message.type ===
                "snapshot"
            ) {

                requests =
                    Array.isArray(
                        message.requests
                    )

                        ?

                        message.requests

                        :

                        [];


                events =
                    Array.isArray(
                        message.events
                    )

                        ?

                        message.events

                        :

                        [];


                traces =
                    Array.isArray(
                        message.traces
                    )

                        ?

                        message.traces

                        :

                        [];


                render();

                return;
            }


            /*
             * Support the older message
             * format as well.
             */
            if (
                message.type ===
                "initialData"
            ) {

                requests =
                    Array.isArray(
                        message.requests
                    )
                        ? message.requests
                        : [];


                events =
                    Array.isArray(
                        message.events
                    )
                        ? message.events
                        : [];


                traces =
                    Array.isArray(
                        message.traces
                    )
                        ? message.traces
                        : [];


                render();

                return;
            }


            /*
             * If a single event arrives,
             * simply wait for the next snapshot.
             */
            if (
                message.type ===
                "event"
            ) {

                render();

                return;
            }
        }
    );


    /*
     * Initial render.
     */
    render();


    console.log(
        "TraceDev Webview loaded"
    );

})();

</script>


</body>

</html>`;
    }


    /*
     * Dispose panel.
     */
    public dispose(): void {

        TracePanel.currentPanel =
            undefined;


        while (
            this.disposables.length
        ) {

            const disposable =
                this.disposables.pop();


            if (
                disposable
            ) {

                disposable.dispose();
            }
        }


        if (
            this.panel
        ) {

            this.panel.dispose();
        }
    }
}


/*
 * Generate a secure nonce
 * for the Webview CSP.
 */
function getNonce(): string {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";


    let result = "";


    for (
        let i = 0;
        i < 32;
        i++
    ) {

        result +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );
    }


    return result;
}