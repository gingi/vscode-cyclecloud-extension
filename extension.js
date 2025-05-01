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
                    return;
                }
                statusBarItem.text = "Cycle Server: Error";
                console.error(`Error: ${stderr} (${error.message})`);
                console.warn(`STDOUT: ${stdout}`);
                return;
            }

            if (/running/i.test(stdout)) {
                statusBarItem.text = "Cycle Server: Running";
                return;
            }
            statusBarItem.text = "Cycle Server: Unknown";
            console.error(`Unexpected output: ${stdout}`);
        });
    };

    const statusCheckTimeout = getStatusTimeoutInterval() * 1000;

    updateStatus();
    const interval = setInterval(updateStatus, statusCheckTimeout);
    context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
