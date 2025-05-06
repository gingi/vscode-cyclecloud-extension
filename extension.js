const vscode = require("vscode");
const { exec } = require("child_process");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = "Cycle Server: Checking...";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    addCommands(context);

    const getCycleServerPath = () => {
        const config = vscode.workspace.getConfiguration("cli");
        return config.get("path", "cycle_server");
    };

    const getStatusTimeoutInterval = () => {
        const config = vscode.workspace.getConfiguration("cli");
        return config.get("statusRefreshInterval", 30);
    }

    const updateStatus = () => {
        const command = `${getCycleServerPath()} status`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                if (/STOPPED/.test(stdout)) {
                    statusBarItem.text = "Cycle Server: Stopped";
                    statusBarItem.tooltip = `STDOUT: ${stdout}\n\n` +
                        `STDERR: ${stderr}`;
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

function addCommands(context) {
    const commands = [
        { id: "cycleCloud.startCycleServer", arg: "start" },
        { id: "cycleCloud.stopCycleServer", arg: "stop" },
        { id: "cycleCloud.restartCycleServer", arg: "restart" }
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
                    new Promise((resolve, reject) => {
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(
                                    `Error running "${cmd}": ${stderr || error.message}`
                                );
                                reject(error);
                            } else {
                                vscode.window.showInformationMessage(
                                    `cycle_server ${arg} completed successfully.`);
                                resolve();
                            }
                        });
                    })
            );
        });

        context.subscriptions.push(disposable);
    }
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
