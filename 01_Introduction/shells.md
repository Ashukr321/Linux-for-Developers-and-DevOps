# Unix Shells

The shell is the command interpreter between you and the kernel. Compare sh, bash, ksh, csh and zsh and see how a shell runs a command.

![Shell scripting overview](../unix-shell-scripting%20(1).png)

## What a shell is

A shell is a user-space program that reads commands, interprets them and asks the kernel to run programs. It is both:

- an **interactive command line** (you type, it runs), and
- a **programming language** for scripts (variables, `if`, loops). See [shell scripting](../05_Shell_Scripting/README.md).

## Main shells

| Shell | Binary | Author / year | Prompt | Notes |
| :--- | :--- | :--- | :---: | :--- |
| Bourne shell | `/bin/sh` | Stephen Bourne, Bell Labs, 1979 | `$` | The original; base of POSIX `sh` |
| C shell | `/bin/csh` | Bill Joy, BSD, 1978 | `%` | C-like syntax, introduced history and aliases |
| Korn shell | `/bin/ksh` | David Korn, Bell Labs, 1983 | `$` | Bourne-compatible plus csh features; common on AIX |
| Bash | `/bin/bash` | Brian Fox, GNU, 1989 | `$` | "Bourne Again SHell"; default on most Linux distros |
| Z shell | `/bin/zsh` | Paul Falstad, 1990 | `%` | Rich completion and themes; default on macOS since 2019 |

The root user's prompt is usually `#` in any shell.

On Debian/Ubuntu, `/bin/sh` is actually `dash`, a small fast POSIX shell. Scripts with `#!/bin/sh` must not use bash-only features.

## Check and change your shell

```bash
echo $SHELL          # your login shell
echo $0              # the shell running right now
cat /etc/shells      # shells allowed for login
```

Sample output:

```text
/bin/bash
bash
# /etc/shells: valid login shells
/bin/sh
/bin/bash
/usr/bin/bash
/bin/dash
/usr/bin/zsh
```

Change your login shell with `chsh` (takes effect on the next login):

```bash
chsh -s /usr/bin/zsh            # change your own shell
sudo chsh -s /bin/bash alice    # change another user's shell
grep alice /etc/passwd          # the last field is the login shell
```

```text
alice:x:1001:1001:Alice:/home/alice:/bin/bash
```

## How a shell executes a command

For a line such as `ls -l *.txt > out.txt`:

1. **Read** the line from the terminal or script.
2. **Tokenize** it into words and operators (`ls`, `-l`, `*.txt`, `>`, `out.txt`).
3. **Expand**: variables (`$HOME`), command substitution (`$(date)`), wildcards (`*.txt` becomes `a.txt b.txt`).
4. **Set up redirection and pipes** (`>`, `<`, `|`). See [redirection](../04_Commands/redirection.md).
5. **Find the command**: alias, then shell function, then **builtin** (`cd`, `echo`), then search `$PATH` for an **external** program.
6. **Run it**: for an external program the shell calls `fork()` to make a child, the child calls `exec()` to load the program, and the parent calls `wait()`.
7. **Store the exit status** in `$?` and print the next prompt.

```bash
type cd ls ll        # builtin, external or alias?
echo $PATH           # where external commands are searched
ls /nope; echo $?    # non-zero exit status means failure
```

```text
cd is a shell builtin
ls is /usr/bin/ls
ll is aliased to `ls -alF'
/usr/local/bin:/usr/bin:/bin
ls: cannot access '/nope': No such file or directory
2
```

`cd` must be a builtin: a child process cannot change the working directory of its parent shell.

## Login vs non-login, interactive vs script

| Type | Started by | Startup files (bash) |
| :--- | :--- | :--- |
| Login shell | SSH, console login, `bash -l` | `/etc/profile`, `~/.bash_profile` |
| Interactive non-login | New terminal tab | `~/.bashrc` |
| Non-interactive | Running a script | none (only `$BASH_ENV`) |

## Common mistakes

**Q1. My script works in bash but fails with `sh script.sh`. Why?**
`sh` may be `dash`, which lacks bash features like `[[ ]]` or arrays. Use `#!/bin/bash` and run it as `./script.sh` or `bash script.sh`.

**Q2. I ran `chsh` but `echo $SHELL` still shows the old shell.**
`$SHELL` is set at login. Log out and back in.

**Q3. I set a shell path in `chsh` and now cannot log in.**
The path must exist and be listed in `/etc/shells`. Fix it as root with `chsh -s /bin/bash user`.

**Q4. What is the difference between `$SHELL` and `$0`?**
`$SHELL` is your login shell from `/etc/passwd`; `$0` is the shell (or script) currently running.
