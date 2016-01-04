'use strict';

import * as vscode from 'vscode';
import * as meteor from './meteorhelper';
import { exec, spawn, ChildProcess } from 'child_process';
var shell = require('shelljs');
var kill = require('tree-kill');
var path = require('path');

interface IMeteorCommandArgument {
    command: string,
    optionArguments?: IMeteorOptionArgument[]
} 

interface IMeteorOptionArgument {
    option: string,
    value: string
}

enum QuickCommandBarState {
    Stopped = 0,
    Running = 1
}

export enum MeteorHelperCommand {
    Run, 
    Stop,
    Reset,
    Debug,
    Action
}

export class MeteorHelper {

    private static _instance: MeteorHelper = new MeteorHelper();
    private _extension = vscode.extensions.getExtension('ramonitor.meteorhelper');
    private _quickCommandBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    private _quickCommandBarState: QuickCommandBarState = QuickCommandBarState.Stopped;
    private _outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('meteorhelper');
    private _config: vscode.WorkspaceConfiguration;
    private _childProcess: ChildProcess;
    private _configSection: string = 'meteorhelper';
    private _quickCommandsObject: { [state: number]: { 'command': string, 'caption': string, 'tooltip'?: string }; } = {};
    private _messageTimeout: number = 5000;
    private _disposable: vscode.Disposable;    

    constructor() {
        if (MeteorHelper._instance) {
            throw new Error("error");
        }
        MeteorHelper._instance = this;

        this._quickCommandsObject[QuickCommandBarState.Stopped] = { command: 'extension.meteorRun', caption: 'Run Meteor', tooltip: 'MeteorHelper: Run Meteor' };
        this._quickCommandsObject[QuickCommandBarState.Running] = { command: 'extension.meteorStop', caption: 'Stop Meteor', tooltip: 'MeteorHelper: Stop Meteor' };

        this.setMeteorHelperConfig(this._configSection);
        this.checkWorkspaceConfigurationAndShowUser();

        this._disposable = vscode.window.setStatusBarMessage(`MeteorHelper: ${this._extension.packageJSON.version} loaded`, this._messageTimeout);
        this.setQuickCommandBar(QuickCommandBarState.Stopped);
    }

    public static getInstance(): MeteorHelper {
        return MeteorHelper._instance;
    }

    public invokeMeteorCommand(command: MeteorHelperCommand) {

        this.setMeteorHelperConfig(this._configSection);
        this.checkWorkspaceConfigurationAndShowUser();
        
        switch (command) {
            case MeteorHelperCommand.Run:
                this.initMeteorRunOrDebug('run');
                break;
            case MeteorHelperCommand.Stop:
                this.initMeteorStop();
                break;
            case MeteorHelperCommand.Reset:
                this.initMeteorReset();
                break;
            case MeteorHelperCommand.Debug:
                this.initMeteorRunOrDebug('debug');
                break;
            default:
                console.log('not implemented');
                break;
        }
    }

    private initMeteorRunOrDebug(runType: string): void {
        let meteorPath = this.getMeteorPath();
        let meteorSettings = this.getMeteorSettingsFile();
        let meteorPort = this.getMeteorPort();
        let projectPath = this.getMeteorAppPath();

        let meteorRunArgument: IMeteorCommandArgument = { command: runType };
        let meteorOptionsArguments: IMeteorOptionArgument[] = [];

        if (meteorSettings) meteorOptionsArguments.push({ option: '--settings', value: meteorSettings });
        if (meteorPort) meteorOptionsArguments.push({ option: '--port', value: meteorPort });

        meteorRunArgument.optionArguments = meteorOptionsArguments

        if (this.isMeteorRunning()) {
            this._disposable = vscode.window.setStatusBarMessage('MeteorHelper: Meteor already running, stop Meteor first..', this._messageTimeout);
            return;
        }
        
        this.execMeteorProcess(meteorPath, projectPath, meteorRunArgument).then(
            (successMessage: string) => {
                this.setQuickCommandBar(QuickCommandBarState.Running);
                this._disposable = vscode.window.setStatusBarMessage(`MeteorHelper: Running (PID: ${this._childProcess.pid})`);
            },
            (errorMessage: string) => {
                this.setQuickCommandBar(QuickCommandBarState.Stopped);
                vscode.window.setStatusBarMessage('MeteorHelper: Error $(alert): ' + errorMessage);
            });
    }
    
    private initMeteorReset(): void {
        let meteorPath = this.getMeteorPath();
        let projectPath = this.getMeteorAppPath();
        let meteorArgument: IMeteorCommandArgument = { command: 'reset' };
        
        this.askUserConfirmation('Reset Meteor Project State', 'Abort Reset', 'Reset Meteor Project State')
            .then((confirmed: boolean) => {
                    this.initMeteorStop()
                        .then(() => this.execMeteorProcess(meteorPath, projectPath, meteorArgument)
                        .then(() => this._disposable = vscode.window.setStatusBarMessage('MeteorHelper: Meteor reset..', this._messageTimeout)));
        }, () => {
            this._disposable = vscode.window.setStatusBarMessage('MeteorHelper: Meteor reset aborted..', this._messageTimeout);
        });
    }

    private initMeteorStop(): Thenable<boolean> {
        this._disposable.dispose();
        
        return new Promise((resolve, reject) => {
            if (this.isMeteorRunning()) {
                this.killProcessTree(this._childProcess.pid)
                    .then((success: string) => {
                        vscode.window.setStatusBarMessage('MeteorHelper: Meteor stopped', this._messageTimeout);
                        resolve(true);
                    },((errorMessage: string) => {
                        this._disposable = vscode.window.setStatusBarMessage('MeteorHelper: Killing Meteor process failed : ' + errorMessage, this._messageTimeout);
                        reject(false);
                    }) 
            )} else {
                console.log('not running');
                resolve(false);                   
            }
        })
    }

    private execMeteorProcess(meteorPath: string, projectPath: string, meteorArgument: IMeteorCommandArgument): Thenable<string> {
        return new Promise((resolve, reject) => {
            this._outputChannel.clear();
            let parameters: string[] = this.getCommandLineParameters(meteorArgument);
            
            try {
                this._childProcess = spawn(meteorPath, parameters, { cwd: projectPath });
                this._outputChannel.show(vscode.ViewColumn.Three);
                
                if (this.isMeteorRunning()){
                    this.setProcessOutputChannel();
                    resolve('Started Meteor with PID : ' + this._childProcess.pid.toString());   
                } 
            } catch (e) {
                reject (e);
            }
        });
    }
    
    private askUserConfirmation(matchedValue: string, ...options: string[]): Thenable<boolean> {
        return new Promise((resolve, reject) => {
            vscode.window.showQuickPick(options).then((value) => {
                if (value === matchedValue) { 
                    resolve(true);
                } else { 
                    reject(false); 
                }
            });
        });
    }

    private getCommandLineParameters(meteorArgument: IMeteorCommandArgument): string[] {
        let parameters: string[] = [];
        parameters.push(meteorArgument.command);

        if (meteorArgument.optionArguments != undefined) {
            meteorArgument.optionArguments.forEach((item) => {
                parameters.push(item.option)
                parameters.push(item.value);
            });
        }

        return parameters;
    }

    private setProcessOutputChannel(): void {
        this._childProcess.stdout.on('data', (data: Buffer) => {
            if (data) {
                this._outputChannel.append(data.toString());
            }
        });

        this._childProcess.stderr.on('data', (data: Buffer) => {
            if (data) {
                this._outputChannel.append(data.toString());
            }
        });

        this._childProcess.on('exit', (exitcode) => {
            this._outputChannel.append('MeteorHelper: Process exited');
            this._disposable = vscode.window.setStatusBarMessage('MeteorHelper: Ready', this._messageTimeout);
            this.setQuickCommandBar(QuickCommandBarState.Stopped);
            this._childProcess = null;
        });
    }

    private isMeteorRunning(): boolean {
        let isRunning = this._childProcess != undefined;
        return isRunning;
    }

    private killProcessTree(pid: number): Thenable<string> {
        return new Promise((resolve, reject) => {
            try {
                kill(pid, 'SIGTERM', (err) => {
                    if (!err) {
                        this._childProcess = null;
                        resolve('Killed PID ' + pid);
                    }
                    else {
                        reject(err);
                    }
                });
            } catch (e) {
                reject(e);
            }
        })
    } 

    private setQuickCommandBar(state?: QuickCommandBarState): void {
        this._quickCommandBarState = state;
        this._quickCommandBar.command = this._quickCommandsObject[this._quickCommandBarState].command;
        this._quickCommandBar.text = this._quickCommandsObject[this._quickCommandBarState].caption;
        this._quickCommandBar.tooltip = this._quickCommandsObject[this._quickCommandBarState].tooltip;
        this._quickCommandBar.show();
    }

    private getMeteorPort(): string {
        let meteorPort = this._config.get('meteorPort', '3000');
        return meteorPort;
    }

    private getMeteorPath(): string {
        let defaultPaths = [{ 
                'platform' : 'win32', 
                'path': '%USERPROFILE%\\AppData\\Local\\.meteor\\meteor.bat'
            }, { 
                'platform' : 'darwin', 
                'path': '/usr/local/bin/meteor'
            }];
        
        let meteorPath = this._config.get('meteorPath', '');
        
        if (!meteorPath) {
            let installPath = defaultPaths.find((obj) => obj.platform === process.platform).path;

            if (process.platform === 'win32') {
                meteorPath = installPath.replace(/%([^%]+)%/g, function(_,n) {
                    return process.env[n];
                });
            } else {
                meteorPath = installPath;
            }
        }
        
        return meteorPath;
    }

    private getMeteorSettingsFile(): string {
        let meteorSettings = this._config.get('meteorSettings', '');
        return meteorSettings;
    }
    
    private setMeteorHelperConfig(section: string): void {
        this._config = vscode.workspace.getConfiguration(section);
        if (!this._config) {
            throw new Error("MeteorHelper: Error getting configuration");
        }
    }
    
    private getMeteorAppPath() : string {
        let relativeProjectPath = this._config.get('relativeProjectPath', '');
        let meteorAppPath;
        let projectPath = vscode.workspace.rootPath;
        
        if (relativeProjectPath) {
            meteorAppPath = path.join(projectPath, relativeProjectPath);
        } else {
            meteorAppPath = projectPath;
        }
        
        return meteorAppPath;
    }
    
    private checkWorkspaceConfigurationAndShowUser() : void {
        let errorMessages: string [] = this.getWorkspaceConfigurationErrors();
        
        if (errorMessages.length > 0) {
            vscode.window.setStatusBarMessage('MeteorHelper: configuration error $(x)');
            vscode.window.showErrorMessage(errorMessages.join(" "), 'Open Workspace Settings')
                .then(() => vscode.commands.executeCommand('workbench.action.openWorkspaceSettings'));
            
            throw new Error ("MeteorHelper: Workspace Configuration Errors");
        }
    }

    private getWorkspaceConfigurationErrors(): string[] {
        let errorMessages: string[] = [];

        let meteorPath = this.getMeteorPath();
        let meteorSettings = this.getMeteorSettingsFile();
        let projectPath = this.getMeteorAppPath();

        if (!shell.test('-f', meteorPath)) {
            errorMessages.push(`Path to Meteor executable not found`);
        }

        let meteorSettingsFullPath = path.join(projectPath, meteorSettings);
        if (meteorSettings && !shell.test('-f', meteorSettingsFullPath)) {
            errorMessages.push(`Path to settings file incorrect`);
        }

        if (errorMessages.length > 0) errorMessages.unshift('MeteorHelper configuration errors:');

        return errorMessages;
    }
    
}
