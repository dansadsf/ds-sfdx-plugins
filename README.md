Permission Set Stuffer
====================

Automatically add fields to your permission sets because you forgot to do it while you were working, or you're lazy. 
This is dangerous and cheeky.

<!-- [![Version](https://img.shields.io/npm/v/permSetStuffer.svg)](https://npmjs.org/package/permSetStuffer)
[![CircleCI](https://circleci.com/gh/dansadsf/permSetStuffer/tree/master.svg?style=shield)](https://circleci.com/gh/dansadsf/permSetStuffer/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/dansadsf/permSetStuffer?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/permSetStuffer/branch/master)
[![Codecov](https://codecov.io/gh/dansadsf/permSetStuffer/branch/master/graph/badge.svg)](https://codecov.io/gh/dansadsf/permSetStuffer)
[![Greenkeeper](https://badges.greenkeeper.io/dansadsf/permSetStuffer.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/dansadsf/permSetStuffer/badge.svg)](https://snyk.io/test/github/dansadsf/permSetStuffer)
[![Downloads/week](https://img.shields.io/npm/dw/permSetStuffer.svg)](https://npmjs.org/package/permSetStuffer)
[![License](https://img.shields.io/npm/l/permSetStuffer.svg)](https://github.com/dansadsf/permSetStuffer/blob/master/package.json) -->

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g permSetStuffer
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
permSetStuffer/0.0.0 darwin-x64 node-v12.16.1
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->

<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
