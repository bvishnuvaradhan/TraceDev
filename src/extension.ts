import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('TraceDev activated');

    const startTraceCommand = vscode.commands.registerCommand(
        'tracedev.startTrace',
        () => {

            vscode.window.showInformationMessage(
                'TraceDev: Trace started'
            );

            console.log('TraceDev: Trace started');
        }
    );

    context.subscriptions.push(startTraceCommand);
}

export function deactivate() {
    console.log('TraceDev deactivated');
}