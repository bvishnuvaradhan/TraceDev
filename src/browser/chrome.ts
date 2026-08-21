import CDP from "chrome-remote-interface";

export interface BrowserClient {
    Runtime: {
        enable(): Promise<void>;
        consoleAPICalled(callback: (params: any) => void): void;
        exceptionThrown(callback: (params: any) => void): void;
    };

    Network: {
        enable(): Promise<void>;
        requestWillBeSent(callback: (params: any) => void): void;
        responseReceived(callback: (params: any) => void): void;
    };

    close(): void;
}

export async function connectToChrome(): Promise<BrowserClient> {
    const client = await CDP({
        host: "localhost",
        port: 9222
    }) as BrowserClient;

    console.log("TraceDev: Connected to Chrome");

    return client;
}