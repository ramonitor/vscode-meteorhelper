# README
## MeteorHelper - Meteor CLI integration into VSCode

Use this VSCode Extension to integrate the Meteor CLI from within Visual Studio Code.

## Installation

1. Press `F1` to bring up Command Palette
2. Search for `Extensions: Install Extension` and select the command
3. Type in 'MeteorHelper' and select the extension to install. 
4. Restart VSCode to activate MeteorHelper.

## Usage

* Optionally specify the MeteorHelper configuration in your workspace settings.json file (all properties begin with the 'meteorhelper' prefix
* Use the MeteorHelper commandbar to start/stop Meteor and to start testing.
* Use the MeteorHelper commands (available via the `F1` key) to perform several Meteor actions like running and stopping Meteor, performing resets etc. 

## List of Meteor commands supported

The current version of MeteorHelper supports the following meteor commands:

* Meteor add
* Meteor debug
* Meteor list
* Meteor npm
* Meteor remove
* Meteor reset
* Meteor run
* Meteor test
* Meteor update

## Relevant Workspace Configuration

The configuration properties stated below can be added to the VSCode configuration to configure settings for Meteor.

```
* meteorhelper.meteorPath: path to the Meteor executable (e.g. /usr/local/bin/meteor on the Mac or %USERPROFILE%\\AppData\\Local\\.meteor\\meteor.bat on Windows
* meteorhelper.meteorPort: port to be used when running the Meteor process (defaults to 3000)
* meteorhelper.meteorSettings: Relative path to the Meteor settings JSON file, e.g. app/settings/settings.debug.json
* meteorhelper.relativeProjectPath: Relative path to your Meteor application, e.g. app
* meteorhelper.envArgs: environment variables to be used with Meteor
* meteorhelper.testConfiguration: test configuration settings
```

 The environment variables Meteor supports, are listed on the [environment-variables.html](https://docs.meteor.com/environment-variables.html) page. Example usage with the envArgs configuration property:
 
```
 "meteorhelper.envArgs": [
        { "argName": "MAIL_URL", "argValue": "smtp://user:pass@yourservice.com:587" },
        { "argName": "MONGO_URL", "argValue": "mongodb://user:password@myserver.com:10139" }
    ]
```

### Meteor Test

To enable testing (meteor test), Meteor 1.3 or above is required. Also, there needs to be a test driver package added into the project. Next, specify the driver package to be used in the driverPackage property under the meteorhelper.testConfiguration workspace section.

In MeteorHelper 0.1.4 the ability is added to specify additional configuration for testing via environment variables. You can use the MeteorHelper workspace configuration to specify these key/value pairs by adding them to the envArgs property under the meteorhelper.testConfiguration section. 

For example, to add 'TEST_WATCH=1' to 'meteor test' (i.e. you want to execute ````TEST_WATCH=1 meteor test --driver-package meteortesting:mocha'````) as mentioned in the [meteor-mocha](https://github.com/meteortesting/meteor-mocha) package, you use the envArgs property like this: 

````
"meteorhelper.testConfiguration": {
    "driverPackage": "meteortesting:mocha",
    "debugPort": "3001",
    "envArgs": [
        {
            "argName": "TEST_WATCH", "argValue": "1"
        }
    ]
}
````

### For more information
* [Meteor Docs](http://docs.meteor.com/#/full/meteorhelp)
* [Meteor](https://www.meteor.com)
* See [Meteor Guide](http://guide.meteor.com/testing.html) for more information about testing.

## Contact Information ##

* [https://twitter.com/ramonitor](https://twitter.com/ramonitor)



