import * as vscode from 'vscode';
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');

interface ITestConfiguration {
    debugPort: string;
    driverPackage: string;
    extraPackages: Array<string>;
    port: string;
    verbose: boolean;
    settings: string;
    envArgs: [IKeyValueConfigItem]
}

interface IKeyValueConfigItem {
    argName: string;
    argValue: string;
}

export class ConfigHelper {
    private static CONFIG_SECTION = 'meteorhelper';
    private static EXTENSION_NAME = 'ramonitor.meteorhelper';
    private static config: vscode.WorkspaceConfiguration;

    private static commandConfig = {
        commands: [
            {
                'command': 'meteorhelper.meteorRun',
                'prompt': 'meteor run',
                'placeHolder': '[target..] [options]'
            },
            {
                'command': 'meteorhelper.meteorAdd',
                'prompt': 'meteor add',
                'placeHolder': '<package> [package..]'
            },
            {
                'command': 'meteorhelper.meteorList',
                'prompt': 'meteor list',
                'placeHolder': '<package> [package..]'
            },
            {
                'command': 'meteorhelper.meteorUpdate',
                'prompt': 'meteor update',
                'placeHolder': 'specify list of packagenames or press enter for an update of the meteor release'
            },
            {
                'command': 'meteorhelper.meteorRemove',
                'prompt': 'meteor remove',
                'placeHolder': '[packageName packageName2 ...]'
            },
            {
                'command': 'meteorhelper.meteorNpm',
                'prompt': 'meteor npm',
                'placeHolder': '<command>'
            }
        ]
    }

    public static setConfiguration(): void {
        this.config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    }

    public static getCommandConfig(command: string): any {
        return this.commandConfig.commands.find(entry => entry.command == command);
    }

    public static getMeteorPath(): string {
        const defaultPaths = [{
            'platform': 'win32',
            'path': '%USERPROFILE%\\AppData\\Local\\.meteor\\meteor.bat'
        }, {
                'platform': 'darwin',
                'path': '/usr/local/bin/meteor'
            }];

        let meteorPath = this.config.get('meteorPath', '');

        if (!meteorPath) {
            const installPath = defaultPaths.find(obj => obj.platform === process.platform).path;

            if (process.platform === 'win32') {
                meteorPath = installPath.replace(/%([^%]+)%/g, function (_, n) {
                    return process.env[n];
                });
            } else {
                meteorPath = installPath;
            }
        }

        return meteorPath;
    }

    public static getMeteorSettingsFile(): string {
        return this.config.get('meteorSettings', '');
    }

    public static getMeteorPort(): string {
        return this.config.get('meteorPort', '');
    }

    public static getMeteorAppPath(): string {
        const projectPath = vscode.workspace.rootPath;
        const relativeProjectPath = this.config.get('relativeProjectPath', '');

        const meteorAppPath = (relativeProjectPath) ? path.join(projectPath, relativeProjectPath) : projectPath;

        return meteorAppPath;
    }

    public static isMeteorProjectFolder(projectFolder: string): boolean {
        return shell.test('-e', path.join(projectFolder, '.meteor'));
    }

    public static getExtensionVersion(): string {
        const extension = vscode.extensions.getExtension(this.EXTENSION_NAME);

        if (extension) {
            return extension.packageJSON.version;
        } else {
            return 'unknown';
        }
    }

    public static getMeteorTestConfig(): ITestConfiguration {
        const testConfig = this.config.get<ITestConfiguration>('testConfiguration');
        return testConfig;
    }
    
    public static getMeteorMajorVersion(): number {
        const release = '.meteor/release';
        const releasefile = path.join(ConfigHelper.getMeteorAppPath(), release);

        if (!shell.test('-f', releasefile)) {
            throw new Error('MeteorHelper: Meteor release file not found - version could not be determined.');
        }

        const releaseVersion: string = fs.readFileSync(releasefile, 'utf8').split('@')[1].substr(0,3);
        return parseFloat(releaseVersion);
    }

    public static getEnvironmentArgsConfig(keyValueItems: IKeyValueConfigItem[]): Object {
        const envArgsObject = keyValueItems.reduce(
            (obj, item) => Object.assign(obj, {[item.argName.toUpperCase()]: item.argValue}), {});

        return envArgsObject;
    }

    public static getEnvironmentArgsConfigString(keyValueObject: Object): string {
        const envArgsString = Object.keys(keyValueObject).map(kv => [kv, keyValueObject[kv]].join('=')).join(' ') + ' ';
        return envArgsString;
    }

}