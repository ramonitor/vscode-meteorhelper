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
* meteorhelper.testConfiguration: test configuration settings
```

### Meteor Test

To enable testing (meteor test), Meteor 1.3 or above is required. Also, there needs to be a test driver package added into the project. Next, specify the driver package to be used in the driverPackage property under the meteorhelper.testConfiguration workspace section.

### For more information
* [Meteor Docs](http://docs.meteor.com/#/full/meteorhelp)
* [Meteor](https://www.meteor.com)
* See [Meteor Guide](http://guide.meteor.com/testing.html) for more information about testing.

## Contact Information ##

* [https://twitter.com/ramonitor](https://twitter.com/ramonitor)

## Release Notes

### 0.1.0

* Added support for the Meteor commands add, remove, list, update, npm and test
* Added support for Meteor testing (requires Meteor 1.3 or higher)
* Added multiple Output Channels (meteor run, test and other commands run in separate output channels)
* Added Meteor version detection
* Several optimization

### 0.0.3

* Project cleanup
* Minor code optimization
* Code on Github

### 0.0.2

* Meteor URL fix

### 0.0.1

* Initial version

** Enjoy!**


