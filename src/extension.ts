import * as vscode from 'vscode';
import * as meteor from './meteorhelper';

export function activate(context: vscode.ExtensionContext) {

    let meteorHelper = meteor.MeteorHelper.getInstance();
    console.log('MeteorHelper activated..');
    
    context.subscriptions.push(vscode.commands.registerCommand('extension.meteorRun', () => {
        return meteorHelper.invokeMeteorCommand(meteor.MeteorHelperCommand.Run);
    }))

    context.subscriptions.push(vscode.commands.registerCommand('extension.meteorDebug', () => {
        return meteorHelper.invokeMeteorCommand(meteor.MeteorHelperCommand.Debug);
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('extension.meteorStop', () => {
        return meteorHelper.invokeMeteorCommand(meteor.MeteorHelperCommand.Stop);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.meteorReset', () => {
        return meteorHelper.invokeMeteorCommand(meteor.MeteorHelperCommand.Reset);
    }));

}

export function deactivate(): void {
    console.log('MeteorHelper deactivated..');
}
