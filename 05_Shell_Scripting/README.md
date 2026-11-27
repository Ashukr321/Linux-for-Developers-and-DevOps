# Shell Scripting Basics

Learn what a shell script is, how the shebang and execute permission work, the ways to run a script, and why every script should start with set -euo pipefail.

![Unix shell scripting overview](../unix-shell-scripting%20%281%29.png)

## What is a shell script?

A shell script is a plain text file containing commands that the shell runs one after another. Anything you can type at the prompt can go into a script: `cd`, `cp`, pipes, loops, conditions and functions. Scripts turn repetitive work (backups, deployments, log cleanup, health checks) into one repeatable command.

In DevOps you meet shell scripts everywhere: Docker `ENTRYPOINT` scripts, CI/CD pipeline steps, cron jobs and server bootstrap (`user_data`) scripts. See [shells](../01_Introduction/shells.md) for the difference between `sh`, `bash`, `ksh` and `zsh`.

## The shebang line

The first line of a script tells the kernel which interpreter should run it:

```bash
#!/bin/bash              # always use bash at this path
#!/usr/bin/env bash      # find bash in $PATH (more portable: macOS, NixOS, containers)
#!/bin/sh                # POSIX sh only (dash on Debian/Ubuntu, no bash features)
```

Without a shebang, the file is run by your current shell, which may behave differently.

## Making a script executable

A new file is not executable by default. Add the execute bit with `chmod` (see [permissions](../02_Filesystem/permissions.md)):

```bash
$ ls -l hello.sh
-rw-r--r-- 1 dev dev 45 Nov 27 10:00 hello.sh
$ chmod +x hello.sh
$ ls -l hello.sh
-rwxr-xr-x 1 dev dev 45 Nov 27 10:00 hello.sh
```

## Ways to run a script

| Command | New process? | Needs `+x`? | Uses shebang? | Typical use |
| :--- | :---: | :---: | :---: | :--- |
| `./script.sh` | Yes | Yes | Yes | Normal way to run a script |
| `bash script.sh` | Yes | No | No (bash forced) | Quick run, debugging with `bash -x` |
| `source script.sh` or `. script.sh` | No (current shell) | No | No | Load variables/functions, e.g. `source ~/.bashrc` |

The key difference: `source` runs the file inside your current shell, so `cd` and `export` inside it change your session. `./script.sh` runs in a child process, and its changes disappear when it exits.

```bash
$ cat setenv.sh
export APP_ENV=production
$ ./setenv.sh && echo "$APP_ENV"     # prints an empty line
$ source setenv.sh && echo "$APP_ENV"
production
```

Why `./`? The current directory is not in `$PATH` (for security), so you must give the path explicitly.

## Strict mode: `set -euo pipefail`

By default bash keeps going after a failed command. In production that is dangerous: a failed `cd` followed by `rm -rf *` can wipe the wrong directory. Put this near the top of every script:

| Option | Effect |
| :--- | :--- |
| `set -e` | Exit immediately when a command returns a non-zero status |
| `set -u` | Treat use of an unset variable as an error |
| `set -o pipefail` | A pipeline fails if any command in it fails, not just the last |
| `set -x` | (Debug) print each command before running it |

```bash
$ bash -c 'false | true; echo "status=$?"'
status=0
$ bash -c 'set -o pipefail; false | true; echo "status=$?"'
status=1
```

## A complete small script

`backup.sh` archives a directory into `/tmp/backups` with a date-stamped name:

```bash
#!/usr/bin/env bash
# backup.sh - archive a directory with a timestamp
set -euo pipefail

SRC="${1:-$HOME/projects}"          # first argument, or a default
DEST="/tmp/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [[ ! -d "$SRC" ]]; then
    echo "Error: $SRC is not a directory" >&2
    exit 1
fi

mkdir -p "$DEST"
ARCHIVE="$DEST/$(basename "$SRC")-$STAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$SRC")" "$(basename "$SRC")"

echo "Backup created: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
```

```bash
$ chmod +x backup.sh
$ ./backup.sh ~/notes
Backup created: /tmp/backups/notes-20261127-101500.tar.gz (12K)
```

Schedule it nightly with cron (see [scheduling](../03_Processes/scheduling.md)): `0 2 * * * /home/dev/backup.sh`.

## What's next

- [vi editor](vi-editor.md) — write and edit scripts on any server
- [Variables](variables.md) — variables, arguments and arithmetic
- [Conditions and loops](conditions-and-loops.md) — `if`, `case`, `for`, `while` and functions

## Interview questions

**Q1. What is the difference between `./script.sh` and `source script.sh`?**
`./script.sh` runs in a new child shell; `source` runs in the current shell, so variable, `cd` and `export` changes persist.

**Q2. What does the shebang do?**
It tells the kernel which interpreter to run the file with when executed directly, e.g. `#!/bin/bash`.

**Q3. You get "Permission denied" running `./deploy.sh`. Why?**
The file lacks the execute bit. Fix with `chmod +x deploy.sh`, or run it as `bash deploy.sh`.

**Q4. Why use `set -euo pipefail`?**
It makes the script stop on errors, unset variables and failures inside pipelines, instead of silently continuing.

**Q5. How do you debug a script?**
Run `bash -x script.sh` or add `set -x` to print every command with its expanded arguments.
