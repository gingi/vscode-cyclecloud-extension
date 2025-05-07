// @ts-check

import * as vscode from "vscode";
import { exec } from "child_process";

/**
 * Activate the extension.
 * @param context - The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = "Cycle Server: Checking...";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const getCycleServerPath = (): string => {
        const config = vscode.workspace.getConfiguration("cli");
        return config.get<string>("path", "cycle_server");
    };

    addCommands(context, getCycleServerPath);

    const getStatusTimeoutInterval = (): number => {
        const config = vscode.workspace.getConfiguration("cli");
        return config.get<number>("statusRefreshInterval", 30);
    };

    const updateStatus = () => {
        const command = `${getCycleServerPath()} status`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (/STOPPED/.test(stdout)) {
                    statusBarItem.text = "Cycle Server: Stopped";
                    statusBarItem.tooltip = `STDOUT: ${stdout}\n\nSTDERR: ${stderr}`;
                    statusBarItem.command = "cyclecloud.startCycleServer";
                    return;
                }
                statusBarItem.text = "Cycle Server: Error";
                console.error(`Error: ${stderr} (${error.message})`);
                console.warn(`STDOUT: ${stdout}`);
                return;
            }

            if (/stopped/i.test(stdout)) {
                statusBarItem.text = "Cycle Server: Stopped";
                statusBarItem.tooltip = "Cycle Server is not running. Click to start.";
                statusBarItem.command = "cyclecloud.startCycleServer";
                return;
            }
            if (/running/i.test(stdout)) {
                statusBarItem.text = "Cycle Server: Running";
                statusBarItem.tooltip = "Cycle Server is running. Click to stop.";
                statusBarItem.command = "cyclecloud.stopCycleServer";
                return;
            }
            statusBarItem.text = "Cycle Server: Unknown";
            statusBarItem.tooltip = "Cycle Server status is unknown. Click to restart.";
            statusBarItem.command = "cyclecloud.restartCycleServer";
            console.error(`Unexpected output: ${stdout}`);
        });
    };

    const statusCheckTimeout = getStatusTimeoutInterval() * 1000;

    updateStatus();
    const interval = setInterval(updateStatus, statusCheckTimeout);

    context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

function addCommands(
    context: vscode.ExtensionContext,
    getCycleServerPath: () => string
) {
    const commands = [
        { id: "cyclecloud.startCycleServer", arg: "start" },
        { id: "cyclecloud.stopCycleServer", arg: "stop" },
        { id: "cyclecloud.restartCycleServer", arg: "restart" }
    ];

    for (const { id, arg } of commands) {
        const disposable = vscode.commands.registerCommand(id, () => {
            const execPath = getCycleServerPath();
            const cmd = `"${execPath}" ${arg} --wait`;

            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Running: ${arg} cycle_server`,
                    cancellable: false
                },
                async () =>
                    new Promise<void>((resolve, reject) => {
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(
                                    `Error running "${cmd}": ${stderr || error.message}`
                                );
                                reject(error);
                            } else {
                                vscode.window.showInformationMessage(
                                    `cycle_server ${arg} completed successfully.`
                                );
                                resolve();
                            }
                        });
                    })
            );
        });

        context.subscriptions.push(disposable);
    }
}

export function deactivate() {}