# CHANGELOG
## MeteorHelper - Meteor CLI integration into VSCode

## 0.1.4
* Added the ability to specify additional testing configuration via the envArgs property of the workspace configuration (Issue [#6](https://github.com/ramonitor/vscode-meteorhelper/issues/6) and Issue [#7](https://github.com/ramonitor/vscode-meteorhelper/issues/7))
* Added support for the 'meteor test' --extra-packages parameter 

## 0.1.3
* Fixed package.json structure of the extension causing it to fail (Issue [#2](https://github.com/ramonitor/vscode-meteorhelper/issues/2))

### 0.1.2
* Running Meteor processes are killed when VSCode is being shutdown (Issue [#1](https://github.com/ramonitor/vscode-meteorhelper/issues/1))

### 0.1.1

* Fixed a bug with the meteor reset command
* Added validation of the Meteor project directory 
* MeteorHelper extension can be activated via the supported MeteorHelper commands

### 0.1.0

* Added support for the Meteor commands add, remove, list, update, npm and test
* Added support for Meteor testing (requires Meteor 1.3 or higher)
* Added multiple Output Channels (meteor run, test and other commands run in separate output channels)
* Added Meteor version detection
* Several optimizations

### 0.0.3

* Project cleanup
* Minor code optimization
* Code on Github

### 0.0.2

* Meteor URL fix

### 0.0.1

* Initial version

** Enjoy!**
