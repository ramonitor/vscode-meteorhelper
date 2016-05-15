import * as vscode from 'vscode';

export enum RunMode {
    Running,
    Debugging,
    Stopped
}

export enum TestMode {
    Normal,
    Full,
    Stopped
}

export class StatusBarHelper implements vscode.Disposable {
    private meteorRunDebugStatusBar: vscode.StatusBarItem;
    private meteorTestStatusBar: vscode.StatusBarItem;
    private statusTextBar: vscode.StatusBarItem;
    private statusTextBarTimeout = 5000;

    constructor() {
        this.statusTextBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 3);
        this.meteorRunDebugStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
        this.meteorTestStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    }

    public dispose(): void {
        this.meteorRunDebugStatusBar.dispose();
        this.meteorTestStatusBar.dispose();
        this.statusTextBar.dispose();
    }
    
    public init(initialMessage): void {
        this.setMessage(initialMessage, true);
        
        this.setMeteorRunStatusBar(RunMode.Stopped, 'Click to start meteor run', 'meteorhelper.meteorRun');
        this.setMeteorTestStatusBar(TestMode.Stopped, 'Click to start meteor test', 'meteorhelper.meteorTest');

        this.meteorRunDebugStatusBar.show();
        this.meteorTestStatusBar.show();
    }

    setMeteorRunStatusBar(state: RunMode, tooltip?: string, command?: string): void {
        tooltip = tooltip || '';
        let text;

        switch (state) {
            case RunMode.Running:
                text = `Meteor: Running`;
                break;
            case RunMode.Debugging:
                text = `Meteor: Debugging`;
                break;
            case RunMode.Stopped:
                text = `Meteor: Idle`;
                break;
        }
        
        this.meteorRunDebugStatusBar.text = text;
        this.meteorRunDebugStatusBar.tooltip = tooltip;
        this.meteorRunDebugStatusBar.command = command;
    }

    setMeteorTestStatusBar(state: TestMode, tooltip?: string, command?: string): void {
        tooltip = tooltip || '';
        let text;

        switch (state) {
            case TestMode.Normal:
                text = `Meteor Test: Running`;
                break;
            case TestMode.Full:
                text = `Meteor Test: Running Full`;
                break;
            case TestMode.Stopped:
                text = `Meteor Test: Idle`;
                break;
        }

        this.meteorTestStatusBar.text = text;
        this.meteorTestStatusBar.tooltip = tooltip;
        this.meteorTestStatusBar.command = command;
    }

    setMessage(message: string, hideAfterTimeout?: boolean, color?: string): Thenable<boolean> {
        return new Promise((resolve, reject) => {
            this.statusTextBar.text = message;
            this.statusTextBar.color = color || null;
            this.statusTextBar.show();

            if (hideAfterTimeout) {
                setTimeout(() => {
                    if (this.statusTextBar.text == message) {
                        this.statusTextBar.hide();
                    }
                    resolve(true);
                }, this.statusTextBarTimeout);
            } else {
                resolve(true);
            }
        });
    }

}