import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { ConfigHelper } from './ConfigHelper';
import { StatusBarHelper, RunMode, TestMode } from './StatusBarHelper';

const shell = require('shelljs');
const kill = require('tree-kill');

enum CommandType {
    Run,
    Debug,
    Test,
    Other
}

class OutputChannelWrapper {
    private owner: MeteorCommand;
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public append(command: MeteorCommand, message: string): void {
        if (command === this.owner) {
            this.outputChannel.append(message);
        }
    }

    public clear(command: MeteorCommand): void {
        if (command === this.owner) {
            this.outputChannel.clear();
        }
    }

    public show(): void {
        this.outputChannel.show(2);
    }

    public setOwner(owner: MeteorCommand): void {
        this.owner = owner;
    }

}

interface IMeteorCommandArgs {
    arguments: string[],
    outputChannel: OutputChannelWrapper;
    statusBar: StatusBarHelper;
    type: CommandType;
    statusBarCallback: IStatusBarStart;
    envArgs?: Object;
}

interface IStatusBarStart {
    (statusBar: StatusBarHelper, type: CommandType, command: MeteorCommand): void;
}

class MeteorCommand {
    private outputChannel: OutputChannelWrapper;
    private process: ChildProcess;
    private arguments: string[];
    private interrupted: boolean;
    private statusBar: StatusBarHelper;
    private commandType: CommandType;
    private statusBarStart: IStatusBarStart;
    private environmentArgs: Object;

    constructor(cmdArgs: IMeteorCommandArgs) {
        this.arguments = cmdArgs.arguments;
        this.outputChannel = cmdArgs.outputChannel;
        this.statusBar = cmdArgs.statusBar;
        this.commandType = cmdArgs.type;
        this.statusBarStart = cmdArgs.statusBarCallback;
        this.environmentArgs = cmdArgs.envArgs;
    }

    public execute(): Thenable<string> {
        return new Promise((resolve, reject) => {
            const meteorPath = ConfigHelper.getMeteorPath();
            const startTime = Date.now();
            const meteorCommand = this.arguments[0];
            const command = 'meteor ' + this.arguments.join(' ');
            const cwd = ConfigHelper.getMeteorAppPath();

            let output = '';

            const envArgsString = this.environmentArgs ? ConfigHelper.getEnvironmentArgsConfigString(this.environmentArgs) : '';
            this.outputChannel.append(this, `MeteorHelper: executing '${envArgsString}${command}'..\n`);
            
            const processEnv = Object.assign({}, process.env, this.environmentArgs);
            this.process = spawn(meteorPath, this.arguments, { cwd, env: processEnv });

            this.statusBarStart(this.statusBar, this.commandType, this);

            this.process.stdout.on('data', (data: Buffer) => {
                this.outputChannel.append(this, data.toString());
            });

            this.process.stderr.on('data', (data: Buffer) => {
                output += data.toString();
                this.outputChannel.append(this, data.toString());
            });

            this.process.on('error', (error: any) => {
                if (error.code === 'ENOENT') {
                    vscode.window.showInformationMessage('MeteorHelper: error ' + error.code);
                }
            });

            this.process.on('exit', code => {
                this.process.removeAllListeners();
                this.process = null;
                const endTime = Date.now();

                this.outputChannel.append(this, `\n"${envArgsString}${command}" completed with code ${code}`);
                this.outputChannel.append(this, `\nIt took approximately ${(endTime - startTime) / 1000} seconds`);

                if (code === 0 || this.interrupted) {
                    resolve(this.interrupted ? '' : output);
                } else {
                    if (code !== 101) {
                        this.outputChannel.append(this, `\n\nMeteorHelper: error ${code}`);
                        if (this.commandType != CommandType.Other) {
                            vscode.window.showErrorMessage(`MeteorHelper: something went wrong, error ${code}`);
                        }
                    }
                    reject(output);
                }
                this.outputChannel.append(this, '\n--------------------------------------------------------------------------------------------------\n');
            });
        });
    }

    public get args(): string[] {
        return this.arguments;
    }

    public get pid(): number {
        return this.process.pid;
    }

    public get type(): CommandType {
        return this.commandType;
    }

    public kill(): Thenable<any> {
        return new Promise(resolve => {
            if (!this.interrupted && this.process) {
                kill(this.process.pid, 'SIGTERM', resolve); // SIGINT
                this.interrupted = true;
            }
        });
    }
}

interface RunningMeteorCommand extends vscode.QuickPickItem {
    meteorCommand: MeteorCommand
}

export class MeteorCommandHelper {
    private static outputChannelRun: OutputChannelWrapper = new OutputChannelWrapper(vscode.window.createOutputChannel('Meteor Run'));
    private static outputChannelTest: OutputChannelWrapper = new OutputChannelWrapper(vscode.window.createOutputChannel('Meteor Test'));
    private static outputChannelMisc: OutputChannelWrapper = new OutputChannelWrapper(vscode.window.createOutputChannel('Meteor'));
    private static statusBar: StatusBarHelper = new StatusBarHelper();
    private static commandExecutionList: MeteorCommand[] = [];

    public static init() {
        ConfigHelper.setConfiguration();

        const extensionVersion = ConfigHelper.getExtensionVersion();
        this.statusBar.init(`MH: Version ${extensionVersion} loaded`);
    }

    public static registerCommand(commandName: string, ...args: string[]): vscode.Disposable {
        return vscode.commands.registerCommand(commandName, () => {
            this.execMeteorCommand(args, false, true, CommandType.Other);
        });
    }

    public static registerRunCommand(commandName: string, ...args: string[]): vscode.Disposable {
        return vscode.commands.registerCommand(commandName, () => {
            this.meteorRunDebug(commandName, args);
        });
    }

    public static registerCommandWithUserInput(commandName: string, isOptionalInput: boolean = false, ...args: string[]): vscode.Disposable {
        return vscode.commands.registerCommand(commandName, () => {
            this.collectUserInput(commandName, isOptionalInput, args).then((commandArgs: string[]) => {
                this.execMeteorCommand(commandArgs, false, true, CommandType.Other);
            });
        });
    }

    public static registerTestCommand(commandName: string, ...args: string[]): vscode.Disposable {
        return vscode.commands.registerCommand(commandName, () => {
            this.setMeteorTestConfig(commandName, args);
        });
    }

    public static stopCommand(commandName: string, ...args: string[]): vscode.Disposable {
        return vscode.commands.registerCommand(commandName, () => {

            this.validateStopCommand();

            const runningCommands = this.getCommandsFromExecutionList();

            vscode.window.showQuickPick(runningCommands, { placeHolder: 'Select a running meteor process to stop..' })
                .then((selectedCommand: RunningMeteorCommand) => {
                    if (selectedCommand) {
                        let meteorCommand = selectedCommand.meteorCommand;
                        meteorCommand.kill();
                    }
                });
        });
    }

    public static stopRunTestCommand(commandName: string, ...args: string[]): vscode.Disposable {
        let commandType: CommandType;

        switch (args[0]) {
            case 'run':
                commandType = CommandType.Run;
                break;
            case 'debug':
                commandType = CommandType.Debug;
                break;
            case 'test':
                commandType = CommandType.Test;
                break;
        }

        return vscode.commands.registerCommand(commandName, () => {
            this.validateStopCommand();

            let meteorCommand: MeteorCommand = this.commandExecutionList.find(c => c.type == commandType);

            if (meteorCommand) {
                meteorCommand.kill();
            }
        });
    }

    public static getCommandsFromExecutionList(): RunningMeteorCommand[] {
        const items: RunningMeteorCommand[] = this.commandExecutionList.map((command) => {
            return {
                label: `meteor ${command.args[0]}`,
                description: command.args.slice(1).join(' '),
                detail: `meteor process id: ${command.pid}`,
                meteorCommand: command
            }
        });

        return items;
    }

    private static validateStopCommand(): void {
        if (this.commandExecutionList.length == 0) {
            vscode.window.showInformationMessage('MeteorHelper: No running commands, nothing to stop..');
            return;
        }
    }

    private static execMeteorCommand(args: string[], force = false, visible = false, type: CommandType, envArgs?: Object): void {
        let outputChannel: OutputChannelWrapper;
        let command: MeteorCommand;

        command = this.commandExecutionList.find((runningCommand: MeteorCommand) => runningCommand.type == type);

        if (!command) {
            const meteorAppPath = ConfigHelper.getMeteorAppPath();

            if (!ConfigHelper.isMeteorProjectFolder(meteorAppPath)) {
                vscode.window.showErrorMessage(`MeteorHelper: ${meteorAppPath} is not a Meteor project directory. Check your workspace configuration.`);
                return;
            }

            switch (type) {
                case CommandType.Debug:
                case CommandType.Run:
                    outputChannel = this.outputChannelRun;
                    break;
                case CommandType.Test:
                    outputChannel = this.outputChannelTest;
                    break;
                default:
                    outputChannel = this.outputChannelMisc;
                    break;
            }

            command = new MeteorCommand({
                arguments: args,
                outputChannel,
                statusBar: this.statusBar,
                type,
                statusBarCallback: this.statusBarStart,
                envArgs
            });

            this.commandExecutionList.push(command);

        } else if (command && type != CommandType.Other) {
            vscode.window.showInformationMessage(`MeteorHelper: Meteor ${command.args[0]} already running (PID: ${command.pid}), stop Meteor first..`);
            return;
        } else {
            vscode.window.showInformationMessage(`MeteorHelper: already running meteor ${command.args[0]}, wait for command to finish..`);
            return;
        }

        if (visible) {
            outputChannel.setOwner(command);
            outputChannel.clear(command);
            outputChannel.show();
        }

        command.execute().then((output: string) => {
            this.removeCommandFromExecutionList(command);
            this.statusBarStop(command.type);
        }, (error: string) => {
            this.removeCommandFromExecutionList(command);
            this.statusBarStop(command.type);
        });
    }

    private static statusBarStop(commandType: CommandType): void {
        switch (commandType) {
            case CommandType.Run:
            case CommandType.Debug:
                this.statusBar.setMeteorRunStatusBar(RunMode.Stopped, 'Click to start meteor run', 'meteorhelper.meteorRun');
                break;
            case CommandType.Test:
                this.statusBar.setMeteorTestStatusBar(TestMode.Stopped, 'Click to start meteor test', 'meteorhelper.meteorTest');
                break;
            case CommandType.Other:
                this.statusBar.setMessage('MH: Done', true);
                break;
        }
    }

    private static statusBarStart(statusBar: StatusBarHelper, commandType: CommandType, command: MeteorCommand) {
        let tooltip = `meteor ${command.args.join(' ')} (PID: ${command.pid})`;

        switch (commandType) {
            case CommandType.Run:
                statusBar.setMeteorRunStatusBar(RunMode.Running, tooltip, 'meteorhelper.meteorStopRun');
                break;
            case CommandType.Debug:
                statusBar.setMeteorRunStatusBar(RunMode.Debugging, tooltip, 'meteorhelper.meteorStopRun');
                break;
            case CommandType.Test:
                statusBar.setMeteorTestStatusBar(TestMode.Normal, tooltip, 'meteorhelper.meteorStopTest');
                break;
            case CommandType.Other:
                statusBar.setMessage(`MH: Meteor ${command.args[0]}`);
                break;
        }
    }

    private static setMeteorTestConfig(commandName: string, args: string[]): void {
        const testConfig = ConfigHelper.getMeteorTestConfig();

        const meteorVersion = ConfigHelper.getMeteorMajorVersion();

        if (meteorVersion < 1.3) {
            vscode.window.showErrorMessage(`MeteorHelper: meteor test requires at least meteor 1.3. Meteor version being used in this project is version ${meteorVersion}.`);
            return;
        }

        if (!testConfig || !testConfig.driverPackage) {
            vscode.window.showInformationMessage('MeteorHelper: no valid Meteor testing configuration in VSCode Workspace Configuration', 'Open Workspace Settings')
                .then(() => vscode.commands.executeCommand('workbench.action.openWorkspaceSettings'));
            return;
        }

        const testMode = commandName === 'meteorhelper.meteorTest' ? TestMode.Normal : TestMode.Full;

        let commandArgs = [];

        if (testConfig.port) {
            commandArgs.push('--port', testConfig.port);
        }

        if (testConfig.debugPort) {
            commandArgs.push('--debug-port', testConfig.debugPort);
        }

        if (testConfig.driverPackage) {
            commandArgs.push('--driver-package', testConfig.driverPackage);
        }

        if (testConfig.extraPackages) {
            commandArgs.push('--extra-packages', testConfig.extraPackages.join(', '));
        }

        if (testConfig.settings) {
            if (!shell.test('-f', testConfig.settings)) {
                vscode.window.showErrorMessage(`MeteorHelper: Settings file ${testConfig.settings} specified in testing configuration not found!`, 'Open Workspace Settings')
                    .then(() => vscode.commands.executeCommand('workbench.action.openWorkspaceSettings'));
                return;
            } else {
                commandArgs.push('--settings', testConfig.settings);
            }
        }

        if (testConfig.verbose) {
            commandArgs.push('--verbose', testConfig.verbose);
        }

        commandArgs = args.concat(commandArgs);

        const envArgs = ConfigHelper.getEnvironmentArgsConfig(testConfig.envArgs);
        
        // if (testConfig.testEnvArgs) {
        //     const { testEnvArgs } = testConfig;
        //     const envArgs = ConfigHelper.getEnvironmentArgsConfig(testEnvArgs);
        //     // const envArgs = testEnvArgs.reduce(
        //     //     (obj, item) => Object.assign(obj, {[item.argName]: item.argValue}), {});
        // }

        this.execMeteorCommand(commandArgs, true, true, CommandType.Test, envArgs);
    }

    private static meteorRunDebug(commandName: string, args: string[]): void {
        let commandArgs = [];

        const settings = ConfigHelper.getMeteorSettingsFile();
        if (settings) {
            commandArgs.push('--settings', settings);
        }

        const port = ConfigHelper.getMeteorPort();
        if (port) {
            commandArgs.push('--port', port);
        }

        commandArgs = args.concat(commandArgs);
        this.execMeteorCommand(commandArgs, true, true, CommandType.Run);
    }

    private static collectUserInput(commandName: string, inputIsOptional: boolean, args: string[]): Thenable<string[]> {

        const { prompt, placeHolder } = ConfigHelper.getCommandConfig(commandName);
        const inputBoxConfig: vscode.InputBoxOptions = { prompt, placeHolder }

        return new Promise((resolve, reject) => {
            vscode.window.showInputBox(inputBoxConfig).then(input => {
                if (!input && !inputIsOptional) {
                    return;
                }

                let commandArgs = input ? args.concat(input.split(' ')) : args;
                resolve(commandArgs);
            });
        });
    }

    private static removeCommandFromExecutionList(command: MeteorCommand): void {
        let index;

        if (command.type == CommandType.Other) {
            index = this.commandExecutionList.indexOf(command);
        } else {
            index = this.commandExecutionList.map(c => c.type).indexOf(command.type);
        }

        if (index > -1) {
            this.commandExecutionList.splice(index, 1);
        }
    }

}