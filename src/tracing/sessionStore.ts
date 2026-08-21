import {
    TraceEvent
} from "./traceStoreTypes";

import {
    TraceSession,
    createTraceSession
} from "./traceSession";


class SessionStore {

    private sessions:
        TraceSession[] = [];

    private currentSession:
        TraceSession | undefined;


    startSession(
        pageUrl: string,
        startedAt: number
    ): TraceSession {

        /*
         * Finish the previous session.
         */
        if (
            this.currentSession
        ) {

            this.currentSession.endedAt =
                startedAt;
        }


        const session =
            createTraceSession(
                pageUrl,
                startedAt
            );


        this.sessions.push(
            session
        );


        this.currentSession =
            session;


        console.log(
            "TraceDev Session Started:",
            session
        );


        return session;
    }


    addEvent(
        event: TraceEvent
    ): void {

        if (
            !this.currentSession
        ) {

            return;
        }


        this.currentSession.events.push(
            event
        );


        console.log(
            "TraceDev Session Event:",
            event.type,
            this.currentSession.id
        );
    }


    getCurrentSession():
        TraceSession | undefined {

        return this.currentSession;
    }


    getSessions():
        TraceSession[] {

        return this.sessions.map(
            session => ({

                ...session,

                events: [
                    ...session.events
                ]
            })
        );
    }


    clear(): void {

        this.sessions = [];

        this.currentSession =
            undefined;
    }
}


export const sessionStore =
    new SessionStore();