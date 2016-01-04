# README
## Extension for the MeteorJS framework

Use this VSCode Extension to start and stop Meteor from within Visual Studio Code.

## Installation

1. Press `F1` to bring up Command Palette
2. Search for `Extensions: Install Extension` and select the command
3. Type in 'MeteorHelper' and select the extension to install. 
4. Restart VSCode to activate MeteorHelper.

## Usage

* Optionally specify the MeteorHelper configuration in your workspace settings.json file (all properties begin with the 'meteorhelper' prefix
* Use the MeteorHelper commandbar on the right side of the statusbar to quickly start or stop Meteor.
* Use the MeteorHelper commands (available via the `F1` key) to perform several Meteor actions like running and stopping Meteor, performing resets etc. 

## Relevant Workspace Configuration

```
* meteorhelper.meteorPath: path to the Meteor executable (e.g. /usr/local/bin/meteor on the Mac or %USERPROFILE%\\AppData\\Local\\.meteor\\meteor.bat on Windows
* meteorhelper.meteorPort: port to be used when running the Meteor process (defaults to 3000)
* meteorhelper.meteorSettings: Relative path to the Meteor settings JSON file, e.g. app/settings/settings.debug.json
* meteorhelper.relativeProjectPath: Relative path to your Meteor application, e.g. app
```

The plan is to make more Meteor functionality available (adding packages from within Visual Studio Code, app deployment etc.) in future MeteorHelper releases. 

### For more information
* [Meteor Docs](http://docs.meteor.com/#/full/meteorhelp)
* [Meteor](https://www.meteor.com)

## Contact Information ##

* [https://twitter.com/ramonitor](https://twitter.com/ramonitor)

## Release Notes

### 0.0.3

* Project cleanup
* Minor code optimization
* Code on Github

### 0.0.2

* Meteor URL fix

### 0.0.1

* Initial version

** Enjoy!**


