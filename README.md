# CycleCloud VSCode Status Extension

This Visual Studio Code extension adds a status bar item that tracks the status of the `cycle_server` service. It periodically checks whether the service is running and updates the display accordingly.

## Features

- Displays the current status of `cycle_server` in the status bar.
- Automatically refreshes.
- CLI path and refresh interval are configurable via settings.

## Configuration

You can set a custom path to the `cycle_server` CLI:

```json
"cli.path": "/full/path/to/cycle_server",
"cli.statusRefreshInterval": 10
```

These can be configured via your `settings.json` or the VSCode Settings UI under CycleCloud.

## Installation

1. Clone the repo and run `npm install`.
1. Run `vsce package` to build the `.vsix`.

Install locally with:

```bash
code --install-extension cyclecloud-vscode-status-0.0.1.vsix
```