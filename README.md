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
$ npm install -g permission-set-stuffer
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
permission-set-stuffer/0.0.0 darwin-x64 node-v12.16.1
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx ds:permset:stuff -p <array> [-e] [-f <string>] [-o <string>] [-n] [-r] [-d <string>] [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-dspermsetstuff--p-array--e--f-string--o-string--n--r--d-string--t-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx ds:permset:stuff -p <array> [-e] [-f <string>] [-o <string>] [-n] [-r] [-d <string>] [-t <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Add fields from your current branch to your permission sets

```
Add fields from your current branch to your permission sets

USAGE
  $ sfdx ds:permset:stuff -p <array> [-e] [-f <string>] [-o <string>] [-n] [-r] [-d <string>] [-t <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --readpermission=true|false                                                   [default: true] Allow read

  -e, --addeverything                                                               Add every field to permission set,
                                                                                    not just current branch

  -f, --permsetpath=permsetpath                                                     [default:
                                                                                    force-app/main/default/permissionset
                                                                                    s] The path to your Permission Set
                                                                                    metadata

  -n, --noprompt                                                                    Do the updates without prompting

  -o, --objectpath=objectpath                                                       [default:
                                                                                    force-app/main/default/objects] The
                                                                                    path to your Object metadata

  -p, --permissionset=permissionset                                                 (required) Comma seperated list of
                                                                                    Permission Set names

  -r, --printall                                                                    Print field names

  -t, --editpermission=true|false                                                   [default: true] Allow edit

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx ds:permset:stuff --permissionset Permission_Set_Devname,Other_Permission_Set 
  
  $ sfdx ds:permset:stuff --permissionset Permission_Set_Devname,Other_Permission_Set --addeverything
```

_See code: [lib/commands/ds/permset/stuff.js](https://github.com/dansadsf/permSetStuffer/blob/v0.0.0/lib/commands/ds/permset/stuff.js)_
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
