import * as vscode from "vscode";

import {
    traceStore
} from "../tracing/traceStore";

import {
    sessionStore
} from "../tracing/sessionStore";


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
         * Update UI whenever TraceStore
         * receives a new event.
         */
        this.disposables.push(

            traceStore.onEvent(
                () => {

                    this.sendSnapshot();
                }
            )
        );


        /*
         * Refresh when the panel becomes visible.
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
         * Dispose listeners when
         * the panel closes.
         */
        this.disposables.push(

            this.panel.onDidDispose(
                () => {

                    this.dispose();
                }
            )
        );


        /*
         * Send existing data.
         */
        setTimeout(
            () => {

                this.sendSnapshot();

            },
            300
        );
    }


    public static createOrShow(
        extensionUri: vscode.Uri
    ): void {

        const column =
            vscode.ViewColumn.One;


        if (
            TracePanel.currentPanel
        ) {

            TracePanel.currentPanel.panel.reveal(
                column
            );


            TracePanel.currentPanel.sendSnapshot();

            return;
        }


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
            new TracePanel(
                panel
            );
    }


    private sendSnapshot(): void {

        try {

            const requests =
                traceStore.getRequests();


            const events =
                traceStore.getAll();


            const traces =
                traceStore.getTraces();


            const sessions =
                sessionStore.getSessions();


            this.panel.webview.postMessage({

                type: "snapshot",

                requests,

                events,

                traces,

                sessions
            });

        } catch (
            error
        ) {

            console.error(
                "TraceDev UI Snapshot Error:",
                error
            );
        }
    }


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
}


.section-count {

    color: #777777;

    font-size: 12px;

    font-weight: normal;

    margin-left: 8px;
}


.empty {

    color: #777777;

    padding: 12px 0;
}


/* ================================= */
/* CONNECTION                        */
/* ================================= */

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
        0 0 8px
        rgba(
            72,
            224,
            138,
            0.5
        );
}


/* ================================= */
/* SESSIONS                          */
/* ================================= */

.session {

    margin-bottom: 22px;

    background: #181818;

    border:
        1px solid #303030;

    border-radius: 9px;

    overflow: hidden;
}


.session-header {

    padding: 17px 18px;

    background: #222222;

    border-bottom:
        1px solid #303030;
}


.session-title {

    font-size: 17px;

    font-weight: 700;

    color: #eeeeee;

    margin-bottom: 7px;
}


.session-url {

    color: #8fcfff;

    word-break: break-all;

    margin-bottom: 8px;
}


.session-meta {

    color: #888888;

    font-size: 12px;
}


/* ================================= */
/* TIMELINE                          */
/* ================================= */

.timeline {

    position: relative;

    padding:
        18px 18px 18px 42px;
}


.timeline::before {

    content: "";

    position: absolute;

    left: 23px;

    top: 18px;

    bottom: 18px;

    width: 2px;

    background: #303030;
}


.timeline-item {

    position: relative;

    margin-bottom: 14px;
}


.timeline-item:last-child {

    margin-bottom: 0;
}


.timeline-dot {

    position: absolute;

    left: -26px;

    top: 16px;

    width: 12px;

    height: 12px;

    border-radius: 50%;

    background: #666666;

    border:
        2px solid #181818;
}


.timeline-card {

    padding: 13px 15px;

    background: #202020;

    border:
        1px solid #303030;

    border-radius: 7px;
}


.timeline-top {

    display: flex;

    align-items: center;

    gap: 8px;

    flex-wrap: wrap;

    margin-bottom: 7px;
}


.timeline-icon {

    font-size: 15px;
}


.timeline-kind {

    font-weight: 700;

    color: #eeeeee;

    font-size: 13px;
}


.timeline-method {

    padding: 3px 6px;

    border-radius: 4px;

    background: #303030;

    color: #cccccc;

    font-size: 10px;

    font-weight: 700;
}


.timeline-status {

    padding: 3px 6px;

    border-radius: 4px;

    background: #26392f;

    color: #65e69a;

    font-size: 10px;

    font-weight: 700;
}


.timeline-status.failed {

    background: #3d2427;

    color: #ff7d86;
}


.timeline-layer {

    padding: 3px 6px;

    border-radius: 4px;

    font-size: 10px;

    font-weight: 700;
}


.layer-frontend {

    background: #293d4b;

    color: #9bd7ff;
}


.layer-backend {

    background: #3c3525;

    color: #f2c94c;
}


.timeline-url {

    color: #9bd7ff;

    word-break: break-all;

    line-height: 1.5;
}


.timeline-meta {

    margin-top: 8px;

    color: #888888;

    font-size: 11px;
}


.timeline-initiator {

    margin-top: 9px;

    padding: 8px 10px;

    background: #161616;

    border-radius: 5px;

    color: #999999;

    font-size: 11px;
}


.timeline-initiator strong {

    color: #dddddd;
}


.timeline-initiator span {

    color: #8fcfff;

    word-break: break-all;
}


/* ================================= */
/* PAGE LOADS                        */
/* ================================= */

.page-load {

    margin-bottom: 12px;

    padding: 15px;

    background: #1d2428;

    border-left:
        5px solid #4db6ff;

    border-radius: 7px;
}


.page-load-title {

    font-size: 15px;

    font-weight: 700;

    margin-bottom: 6px;
}


.page-load-url {

    color: #8fcfff;

    word-break: break-all;
}


.page-load-meta {

    margin-top: 7px;

    color: #999999;

    font-size: 12px;
}


/* ================================= */
/* NETWORK                           */
/* ================================= */

.network-card {

    margin-bottom: 10px;

    padding: 14px 15px;

    background: #19343f;

    border-left:
        5px solid #45dc91;

    border-radius: 7px;
}


.network-card.failed {

    border-left-color: #ff6570;
}


.network-header {

    display: flex;

    align-items: center;

    gap: 9px;

    flex-wrap: wrap;

    margin-bottom: 7px;
}


.network-method {

    font-weight: 700;

    color: #eeeeee;
}


.network-status {

    font-weight: 700;

    color: #eeeeee;
}


.network-url {

    color: #9bd7ff;

    word-break: break-all;
}


.network-meta {

    margin-top: 7px;

    color: #999999;

    font-size: 11px;

    line-height: 1.6;
}


.network-initiator {

    margin-top: 9px;

    color: #999999;

    font-size: 11px;
}


/* ================================= */
/* CONSOLE                           */
/* ================================= */

.console-card {

    margin-bottom: 10px;

    padding: 13px 15px;

    background: #302c18;

    border-left:
        5px solid #f2c94c;

    border-radius: 7px;
}


.console-header {

    display: flex;

    align-items: center;

    gap: 10px;

    margin-bottom: 6px;
}


.console-level {

    font-weight: 700;

    color: #f2c94c;
}


.console-time {

    color: #999999;

    font-size: 11px;
}


.console-message {

    color: #dddddd;

    white-space: pre-wrap;

    word-break: break-word;
}


/* ================================= */
/* ERRORS                            */
/* ================================= */

.error-card {

    margin-bottom: 10px;

    padding: 13px 15px;

    background: #351c20;

    border-left:
        5px solid #ff6570;

    border-radius: 7px;
}


.error-title {

    font-weight: 700;

    color: #ff7d86;

    margin-bottom: 6px;
}


.error-message {

    color: #dddddd;

    white-space: pre-wrap;

    word-break: break-word;
}

</style>

</head>


<body>


<h1>TraceDev</h1>


<div class="connection">

    <div class="connection-dot"></div>

    <span>Browser Connected</span>

</div>


<!-- ================================= -->
<!-- TRACE SESSIONS                    -->
<!-- ================================= -->

<section>

<h2>
    TRACE SESSIONS
    <span
        id="sessionCount"
        class="section-count"
    ></span>
</h2>


<div id="sessions">

    <div class="empty">
        Waiting for trace sessions...
    </div>

</div>

</section>


<!-- ================================= -->
<!-- PAGE LOADS                        -->
<!-- ================================= -->

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


<!-- ================================= -->
<!-- NETWORK                           -->
<!-- ================================= -->

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


<!-- ================================= -->
<!-- CONSOLE                           -->
<!-- ================================= -->

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


<!-- ================================= -->
<!-- ERRORS                            -->
<!-- ================================= -->

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


let requests = [];

let events = [];

let traces = [];

let sessions = [];


const sessionsContainer =
    document.getElementById(
        "sessions"
    );


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


const sessionCount =
    document.getElementById(
        "sessionCount"
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


function formatTime(
    timestamp
) {

    if (
        timestamp === undefined ||
        timestamp === null
    ) {

        return "";
    }


    return new Date(
        Number(timestamp)
    ).toLocaleTimeString();
}


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


    return (
        Math.max(
            0,
            Math.round(number)
        ) +
        " ms"
    );
}


function dataOf(
    event
) {

    return (
        event &&
        event.data
    ) || {};
}


function requestUrl(
    request
) {

    const data =
        dataOf(
            request
        );


    return (
        data.url ||
        request.url ||
        ""
    );
}


function requestMethod(
    request
) {

    const data =
        dataOf(
            request
        );


    return (
        data.method ||
        request.method ||
        "GET"
    );
}


function requestStatus(
    request
) {

    const data =
        dataOf(
            request
        );


    return (
        data.status ??
        request.status ??
        ""
    );
}


function requestDuration(
    request
) {

    const data =
        dataOf(
            request
        );


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
        request.endTime;


    if (
        start !== undefined &&
        end !== undefined
    ) {

        return (
            Number(end) -
            Number(start)
        );
    }


    return undefined;
}


function isFailed(
    request
) {

    const data =
        dataOf(
            request
        );


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


    return status >= 400;
}


function getInitiator(
    request
) {

    const data =
        dataOf(
            request
        );


    return (
        data.initiator ||
        request.initiator
    );
}


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
        value.endsWith(".js") ||
        value.endsWith(".css") ||
        value.endsWith(".html") ||
        value.endsWith("/")
    ) {

        return "FRONTEND";
    }


    return "";
}


function getIcon(
    request
) {

    const type =
        String(
            request.type ||
            ""
        ).toLowerCase();


    const url =
        requestUrl(
            request
        ).toLowerCase();


    if (
        type === "document" ||
        url.endsWith("/")
    ) {

        return "🌐";
    }


    if (
        type === "stylesheet" ||
        url.endsWith(".css")
    ) {

        return "🎨";
    }


    if (
        type === "script" ||
        url.endsWith(".js")
    ) {

        return "⚙️";
    }


    if (
        type === "image" ||
        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url)
    ) {

        return "🖼️";
    }


    if (
        url.includes("/api/")
    ) {

        return "🔵";
    }


    return "📦";
}


function getKind(
    request
) {

    const type =
        String(
            request.type ||
            ""
        ).toLowerCase();


    const url =
        requestUrl(
            request
        ).toLowerCase();


    if (
        type === "document" ||
        url.endsWith("/")
    ) {

        return "Document";
    }


    if (
        type === "stylesheet" ||
        url.endsWith(".css")
    ) {

        return "Stylesheet";
    }


    if (
        type === "script" ||
        url.endsWith(".js")
    ) {

        return "Script";
    }


    if (
        type === "image"
    ) {

        return "Image";
    }


    if (
        url.includes("/api/")
    ) {

        return "Backend API";
    }


    return "Resource";
}


function getRequestId(
    request
) {

    return (
        request.requestId ||
        (
            dataOf(
                request
            ).requestId
        )
    );
}


/*
 * Create one network item
 * from a session's events.
 */
function buildSessionRequests(
    session
) {

    const sessionEvents =
        Array.isArray(
            session.events
        )
            ? session.events
            : [];


    const requestMap =
        new Map();


    sessionEvents.forEach(
        function (
            event
        ) {

            const data =
                dataOf(
                    event
                );


            /*
             * Page-load marker events
             * are not network cards.
             */
            if (
                data.pageLoadStarted ||
                data.pageLoadFinished
            ) {

                return;
            }


            if (
                event.type !== "request" &&
                event.type !== "response"
            ) {

                return;
            }


            const requestId =
                data.requestId;


            if (
                !requestId
            ) {

                return;
            }


            let item =
                requestMap.get(
                    requestId
                );


            if (
                !item
            ) {

                item = {

                    requestId,

                    method:
                        data.method ||
                        "GET",

                    url:
                        data.url ||
                        "",

                    type:
                        data.resourceType ||
                        data.type,

                    startTime:
                        data.startTime ||
                        event.timestamp,

                    endTime:
                        undefined,

                    status:
                        undefined,

                    failed:
                        false,

                    initiator:
                        data.initiator
                };


                requestMap.set(
                    requestId,
                    item
                );
            }


            if (
                event.type ===
                "request"
            ) {

                item.method =
                    data.method ||
                    item.method;


                item.url =
                    data.url ||
                    item.url;


                item.type =
                    data.resourceType ||
                    data.type ||
                    item.type;


                item.startTime =
                    data.startTime ||
                    item.startTime;


                item.initiator =
                    data.initiator ||
                    item.initiator;
            }


            if (
                event.type ===
                "response"
            ) {

                if (
                    data.status !==
                    undefined
                ) {

                    item.status =
                        data.status;
                }


                item.endTime =
                    data.endTime ||
                    event.timestamp;


                if (
                    data.duration !==
                    undefined
                ) {

                    item.duration =
                        data.duration;
                }


                item.failed =
                    data.failed === true ||
                    Number(
                        data.status
                    ) >= 400;
            }
        }
    );


    return Array.from(
        requestMap.values()
    );
}


/*
 * Render the main session timeline.
 */
function renderSessions() {

    if (
        sessions.length === 0
    ) {

        sessionsContainer.innerHTML =

            '<div class="empty">' +
            'Waiting for trace sessions...' +
            '</div>';

        sessionCount.textContent =
            "";

        return;
    }


    sessionCount.textContent =
        "(" +
        sessions.length +
        ")";


    sessionsContainer.innerHTML =
        sessions
            .slice()
            .reverse()
            .map(
                function (
                    session,
                    reverseIndex
                ) {

                    const sessionNumber =
                        sessions.length -
                        reverseIndex;


                    const sessionRequests =
                        buildSessionRequests(
                            session
                        );


                    const sessionEvents =
                        Array.isArray(
                            session.events
                        )
                            ? session.events
                            : [];


                    const consoleEvents =
                        sessionEvents.filter(
                            function (
                                event
                            ) {

                                return (
                                    event.type ===
                                    "console"
                                );
                            }
                        );


                    const items = [];


                    /*
                     * Add network requests.
                     */
                    sessionRequests.forEach(
                        function (
                            request
                        ) {

                            items.push({

                                kind: "network",

                                timestamp:
                                    request.startTime,

                                request
                            });
                        }
                    );


                    /*
                     * Add console events.
                     */
                    consoleEvents.forEach(
                        function (
                            event
                        ) {

                            items.push({

                                kind: "console",

                                timestamp:
                                    event.timestamp,

                                event
                            });
                        }
                    );


                    /*
                     * Sort everything by time.
                     */
                    items.sort(
                        function (
                            a,
                            b
                        ) {

                            return (
                                Number(
                                    a.timestamp
                                ) -
                                Number(
                                    b.timestamp
                                )
                            );
                        }
                    );


                    const timelineHtml =
                        items.length === 0

                            ?

                            '<div class="empty">' +
                            'No events in this session yet.' +
                            '</div>'

                            :

                            items
                                .map(
                                    function (
                                        item
                                    ) {

                                        if (
                                            item.kind ===
                                            "console"
                                        ) {

                                            return renderSessionConsole(
                                                item.event
                                            );
                                        }


                                        return renderSessionRequest(
                                            item.request
                                        );
                                    }
                                )
                                .join("");


                    const duration =
                        session.endedAt !==
                        undefined

                            ?

                            Number(
                                session.endedAt
                            ) -
                            Number(
                                session.startedAt
                            )

                            :

                            undefined;


                    return (

                        '<div class="session">' +

                            '<div class="session-header">' +

                                '<div class="session-title">' +

                                    'PAGE LOAD #' +

                                    sessionNumber +

                                '</div>' +

                                '<div class="session-url">' +

                                    escapeHtml(
                                        session.pageUrl
                                    ) +

                                '</div>' +

                                '<div class="session-meta">' +

                                    formatTime(
                                        session.startedAt
                                    ) +

                                    ' • ' +

                                    (
                                        duration !== undefined

                                            ?

                                            formatDuration(
                                                duration
                                            )

                                            :

                                            "Active"
                                    ) +

                                    ' • ' +

                                    items.length +

                                    ' timeline items' +

                                '</div>' +

                            '</div>' +

                            '<div class="timeline">' +

                                timelineHtml +

                            '</div>' +

                        '</div>'
                    );
                }
            )
            .join("");
}


function renderSessionRequest(
    request
) {

    const url =
        requestUrl(
            request
        );


    const method =
        requestMethod(
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
        isFailed(
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


    const icon =
        getIcon(
            request
        );


    const kind =
        getKind(
            request
        );


    let initiatorHtml =
        "";


    if (
        initiator
    ) {

        const type =
            initiator.type ||
            "unknown";


        const sourceUrl =
            initiator.url ||
            "";


        let location =
            "";


        if (
            initiator.lineNumber !==
            undefined
        ) {

            location =
                ":" +
                (
                    Number(
                        initiator.lineNumber
                    ) + 1
                );


            if (
                initiator.columnNumber !==
                undefined
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

            '<div class="timeline-initiator">' +

                '<strong>Initiator:</strong> ' +

                escapeHtml(
                    type
                ) +

                (
                    sourceUrl

                        ?

                        ' — <span>' +

                        escapeHtml(
                            sourceUrl
                        ) +

                        escapeHtml(
                            location
                        ) +

                        '</span>'

                        :

                        ''
                ) +

            '</div>';
    }


    return (

        '<div class="timeline-item">' +

            '<div class="timeline-dot"></div>' +

            '<div class="timeline-card">' +

                '<div class="timeline-top">' +

                    '<span class="timeline-icon">' +

                        icon +

                    '</span>' +

                    '<span class="timeline-kind">' +

                        escapeHtml(
                            kind
                        ) +

                    '</span>' +

                    '<span class="timeline-method">' +

                        escapeHtml(
                            method
                        ) +

                    '</span>' +

                    '<span class="timeline-status ' +

                        (
                            failed
                                ? "failed"
                                : ""
                        ) +

                    '">' +

                        escapeHtml(
                            status
                                ? String(status)
                                : "—"
                        ) +

                    '</span>' +

                    (
                        layer === "FRONTEND"

                            ?

                            '<span class="timeline-layer layer-frontend">' +
                            'FRONTEND' +
                            '</span>'

                            :

                        layer === "BACKEND"

                            ?

                            '<span class="timeline-layer layer-backend">' +
                            'BACKEND' +
                            '</span>'

                            :

                            ''
                    ) +

                '</div>' +

                '<div class="timeline-url">' +

                    escapeHtml(
                        url
                    ) +

                '</div>' +

                '<div class="timeline-meta">' +

                    'Started: ' +

                    formatTime(
                        request.startTime
                    ) +

                    ' • Duration: ' +

                    formatDuration(
                        duration
                    ) +

                    ' • ' +

                    (
                        failed
                            ? "❌ Failed"
                            : "✅ Success"
                    ) +

                '</div>' +

                initiatorHtml +

            '</div>' +

        '</div>'
    );
}


function renderSessionConsole(
    event
) {

    const data =
        dataOf(
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


    let message = "";


    if (
        Array.isArray(
            values
        )
    ) {

        message =
            values
                .map(
                    function (
                        value
                    ) {

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

        '<div class="timeline-item">' +

            '<div class="timeline-dot"></div>' +

            '<div class="timeline-card">' +

                '<div class="timeline-top">' +

                    '<span class="timeline-icon">' +
                        '📝' +
                    '</span>' +

                    '<span class="timeline-kind">' +
                        'Console' +
                    '</span>' +

                    '<span class="timeline-method">' +

                        escapeHtml(
                            String(
                                level
                            ).toUpperCase()
                        ) +

                    '</span>' +

                '</div>' +

                '<div class="timeline-url">' +

                    escapeHtml(
                        message
                    ) +

                '</div>' +

                '<div class="timeline-meta">' +

                    formatTime(
                        event.timestamp
                    ) +

                '</div>' +

            '</div>' +

        '</div>'
    );
}


/*
 * =================================
 * PAGE LOADS
 * =================================
 */

function renderPageLoads() {

    const pageRequests =
        requests.filter(
            function (
                request
            ) {

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
                function (
                    request
                ) {

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
                        isFailed(
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
                                        : "—"
                                ) +

                                ' ' +

                                (
                                    failed
                                        ? "❌ Failed"
                                        : "✅ Success"
                                ) +

                            '</div>' +

                        '</div>'
                    );
                }
            )
            .join("");
}


/*
 * =================================
 * NETWORK
 * =================================
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
                function (
                    request
                ) {

                    const url =
                        requestUrl(
                            request
                        );


                    const method =
                        requestMethod(
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
                        isFailed(
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


                    return (

                        '<div class="network-card ' +

                            (
                                failed
                                    ? "failed"
                                    : ""
                            ) +

                        '">' +

                            '<div class="network-header">' +

                                '<span class="network-method">' +

                                    escapeHtml(
                                        method
                                    ) +

                                '</span>' +

                                '<span class="network-status">' +

                                    escapeHtml(
                                        status
                                            ? String(status)
                                            : "—"
                                    ) +

                                '</span>' +

                                (
                                    layer ===
                                    "FRONTEND"

                                        ?

                                        '<span class="timeline-layer layer-frontend">' +
                                        'FRONTEND' +
                                        '</span>'

                                        :

                                    layer ===
                                    "BACKEND"

                                        ?

                                        '<span class="timeline-layer layer-backend">' +
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
                                    request.startTime
                                ) +

                                ' • Completed: ' +

                                formatTime(
                                    request.endTime
                                ) +

                                ' • Duration: ' +

                                formatDuration(
                                    duration
                                ) +

                                ' • ' +

                                (
                                    failed
                                        ? "❌ Failed"
                                        : "✅ Success"
                                ) +

                            '</div>' +

                            (
                                initiator

                                    ?

                                    '<div class="network-initiator">' +

                                        '<strong>Initiator:</strong> ' +

                                        escapeHtml(
                                            initiator.type ||
                                            "unknown"
                                        ) +

                                        (
                                            initiator.url

                                                ?

                                                ' — <span>' +

                                                escapeHtml(
                                                    initiator.url
                                                ) +

                                                (
                                                    initiator.lineNumber !==
                                                    undefined

                                                        ?

                                                        ":" +
                                                        (
                                                            Number(
                                                                initiator.lineNumber
                                                            ) + 1
                                                        ) +

                                                        (
                                                            initiator.columnNumber !==
                                                            undefined

                                                                ?

                                                                ":" +
                                                                (
                                                                    Number(
                                                                        initiator.columnNumber
                                                                    ) + 1
                                                                )

                                                                :

                                                                ""
                                                        )

                                                        :

                                                        ""
                                                ) +

                                                '</span>'

                                                :

                                                ''
                                        ) +

                                    '</div>'

                                    :

                                    ''
                            ) +

                        '</div>'
                    );
                }
            )
            .join("");
}


/*
 * =================================
 * CONSOLE
 * =================================
 */

function renderConsole() {

    const consoleEvents =
        events.filter(
            function (
                event
            ) {

                return (
                    event.type ===
                    "console"
                );
            }
        );


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
                function (
                    event
                ) {

                    const data =
                        dataOf(
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
                        Array.isArray(
                            values
                        )
                    ) {

                        message =
                            values
                                .map(
                                    function (
                                        value
                                    ) {

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
 * =================================
 * ERRORS
 * =================================
 */

function renderErrors() {

    const errorEvents =
        events.filter(
            function (
                event
            ) {

                if (
                    event.type ===
                    "exception"
                ) {

                    return true;
                }


                if (
                    event.type ===
                    "console"
                ) {

                    const data =
                        dataOf(
                            event
                        );


                    const level =
                        String(
                            data.type ||
                            data.level ||
                            ""
                        ).toLowerCase();


                    return (
                        level ===
                        "error"
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
                function (
                    event
                ) {

                    const data =
                        dataOf(
                            event
                        );


                    const values =
                        data.values ||
                        data.args ||
                        data.message ||
                        "";


                    let message;


                    if (
                        Array.isArray(
                            values
                        )
                    ) {

                        message =
                            values
                                .map(
                                    function (
                                        value
                                    ) {

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
 * =================================
 * RECEIVE SNAPSHOT
 * =================================
 */

window.addEventListener(
    "message",
    function (
        event
    ) {

        const message =
            event.data;


        if (
            !message
        ) {

            return;
        }


        if (
            message.type !==
            "snapshot"
        ) {

            return;
        }


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


        sessions =
            Array.isArray(
                message.sessions
            )
                ? message.sessions
                : [];


        renderSessions();

        renderPageLoads();

        renderNetwork();

        renderConsole();

        renderErrors();
    }
);


renderSessions();

renderPageLoads();

renderNetwork();

renderConsole();

renderErrors();

})();

</script>

</body>

</html>`;
    }


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


        this.panel.dispose();
    }
}


/*
 * Generate a Webview nonce.
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