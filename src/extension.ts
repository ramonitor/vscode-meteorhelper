import * as vscode from 'vscode';
import { MeteorCommandHelper } from './mh/MeteorCommandHelper';
import { ConfigHelper } from './mh/ConfigHelper';

export function activate(context: vscode.ExtensionContext) {

    console.log('MeteorHelper activated..');

    MeteorCommandHelper.init();

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        ConfigHelper.setConfiguration();
    }));

    context.subscriptions.push(MeteorCommandHelper.registerRunCommand('meteorhelper.meteorRun', 'run'));
    context.subscriptions.push(MeteorCommandHelper.registerRunCommand('meteorhelper.meteorDebug', 'debug'));

    context.subscriptions.push(MeteorCommandHelper.registerTestCommand('meteorhelper.meteorTest', 'test'));
    context.subscriptions.push(MeteorCommandHelper.registerTestCommand('meteorhelper.meteorTestFullApp', 'test', 'full-app'));

    context.subscriptions.push(MeteorCommandHelper.stopCommand('meteorhelper.meteorStop'));
    context.subscriptions.push(MeteorCommandHelper.stopRunTestCommand('meteorhelper.meteorStopRun', 'run'));
    context.subscriptions.push(MeteorCommandHelper.stopRunTestCommand('meteorhelper.meteorStopTest', 'test'));

    context.subscriptions.push(MeteorCommandHelper.registerCommand('meteorhelper.meteorReset', 'reset'));
    context.subscriptions.push(MeteorCommandHelper.registerCommand('meteorhelper.meteorList', 'list'));

    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('meteorhelper.meteorAdd', false, 'add'));
    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('meteorhelper.meteorRemove', false, 'remove'));
    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('meteorhelper.meteorUpdate', true, 'update'));
    context.subscriptions.push(MeteorCommandHelper.registerCommandWithUserInput('meteorhelper.meteorNpm', false, 'npm'));

}

export function deactivate(): void {
    console.log('MeteorHelper deactivated..');
}


