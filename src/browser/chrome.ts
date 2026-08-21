import CDP from "chrome-remote-interface";

export type BrowserClient = {
    Runtime: {
        enable(): Promise<void>;

        consoleAPICalled(
            callback: (params: any) => void
        ): void;

        exceptionThrown(
            callback: (params: any) => void
        ): void;
    };

    Network: {
        enable(): Promise<void>;

        requestWillBeSent(
            callback: (params: any) => void
        ): void;

        responseReceived(
            callback: (params: any) => void
        ): void;

        loadingFinished(
            callback: (params: any) => void
        ): void;

        loadingFailed(
            callback: (params: any) => void
        ): void;
    };

    close(): void;
};


export async function connectToChrome():
    Promise<BrowserClient> {

    const client =
        await CDP({
            port: 9222
        });


    console.log(
        "TraceDev: Connected to Chrome"
    );


    /*
     * chrome-remote-interface
     * exposes the actual CDP domains.
     */

    const Runtime =
        client.Runtime;

    const Network =
        client.Network;


    return {

        Runtime: {

            enable:
                () =>
                    Runtime.enable(),

            consoleAPICalled:
                (callback) => {

                    Runtime.consoleAPICalled(
                        callback
                    );
                },

            exceptionThrown:
                (callback) => {

                    Runtime.exceptionThrown(
                        callback
                    );
                }
        },


        Network: {

            enable:
                () =>
                    Network.enable(),

            requestWillBeSent:
                (callback) => {

                    Network.requestWillBeSent(
                        callback
                    );
                },

            responseReceived:
                (callback) => {

                    Network.responseReceived(
                        callback
                    );
                },

            loadingFinished:
                (callback) => {

                    Network.loadingFinished(
                        callback
                    );
                },

            loadingFailed:
                (callback) => {

                    Network.loadingFailed(
                        callback
                    );
                }
        },


        close:
            () => {

                client.close();
            }
    };
}