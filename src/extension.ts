import * as vscode from 'vscode';
import { MeteorCommandHelper } from './mh/MeteorCommandHelper';
import { ConfigHelper } from './mh/ConfigHelper';

export function activate(context: vscode.ExtensionContext) {

    console.log('MeteorHelper activated..');

    ConfigHelper.setConfiguration();
    MeteorCommandHelper.init();

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        ConfigHelper.setConfiguration();
    }));

    context.subscriptions.push(MeteorCommandHelper.registerRunCommand('extension.meteorRun', 'run'));
    context.subscriptions.push(MeteorCommandHelper.registerRunCommand('extension.meteorDebug', 'debug'));

    context.subscriptions.push(MeteorCommandHelper.registerTestCommand('extension.meteorTest', 'test'));
    context.subscriptions.push(MeteorCommandHelper.registerTestCommand('extension.meteorTestFullApp', 'test', 'full-app'));

    context.subscriptions.push(MeteorCommandHelper.stopCommand('extension.meteorStop'));
    context.subscriptions.push(MeteorCommandHelper.stopRunTestCommand('extension.meteorStopRun', 'run'));
    context.subscriptions.push(MeteorCommandHelper.stopRunTestCommand('extension.meteorStopTest', 'test'));

    context.subscriptions.push(MeteorCommandHelper.registerCommand('extension.meteorReset', 'reset'));
    context.subscriptions.push(MeteorCommandHelper.registerCommand('extension.meteorList', 'list'));

    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('extension.meteorAdd', false, 'add'));
    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('extension.meteorRemove', false, 'remove'));
    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('extension.meteorUpdate', true, 'update'));
    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('extension.meteorNpm', false, 'npm'));

}

export function deactivate(): void {
    console.log('MeteorHelper deactivated..');
}


