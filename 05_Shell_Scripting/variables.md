# Variables, Input and Arithmetic

Shell variables, quoting rules, environment variables and export, read/echo/printf, positional parameters, set and shift, arithmetic and command substitution.

## Defining and using variables

```bash
name="Ashu"            # no spaces around =
count=5
echo "$name has $count servers"
echo "${name}_backup"  # braces separate the name from following text
unset count            # delete the variable
readonly PI=3.14       # cannot be changed later
```

Variables are untyped strings. Names may contain letters, digits and `_`, and must not start with a digit. By convention, environment variables are `UPPERCASE` and script-local ones `lowercase`.

## Quoting rules

| Quote | Variables expanded? | Example | Output |
| :--- | :---: | :--- | :--- |
| Double `"..."` | Yes | `echo "Home: $HOME"` | `Home: /home/dev` |
| Single `'...'` | No | `echo 'Home: $HOME'` | `Home: $HOME` |
| Backslash `\` | Escapes one char | `echo "Cost: \$5"` | `Cost: $5` |
| None | Yes, plus word splitting and globbing | `echo $file` | Breaks on spaces |

Rule of thumb: always double-quote variables (`"$file"`), so file names with spaces do not break your script.

## Environment variables and `export`

A plain variable exists only in the current shell. `export` makes it an environment variable, copied to every child process.

```bash
$ APP_ENV=dev
$ bash -c 'echo "child sees: $APP_ENV"'
child sees:
$ export APP_ENV=dev
$ bash -c 'echo "child sees: $APP_ENV"'
child sees: dev
$ PORT=8080 node server.js     # set a variable for one command only
```

Common ones: `HOME`, `USER`, `PATH`, `PWD`, `SHELL`, `LANG`. List them with `env` or `printenv`; add permanent ones to `~/.bashrc` or `~/.profile`.

```bash
export PATH="$HOME/bin:$PATH"   # add your own scripts directory to PATH
```

## Input and output: `read`, `echo`, `printf`

```bash
read -p "Enter your name: " user          # prompt and read a line
read -sp "Password: " pass; echo          # -s hides typing
read -t 10 -p "Continue? (y/n) " ans      # time out after 10 seconds
echo "Hello, $user"
echo -e "Line1\nLine2"                     # -e enables escapes like \n \t
printf "%-10s %5d\n" "nginx" 42            # formatted, portable output
```

`printf` is more predictable than `echo` across shells; prefer it for formatted output.

## Positional parameters and special variables

Run as `./deploy.sh web 3 prod`:

| Variable | Meaning | Value |
| :--- | :--- | :--- |
| `$0` | Script name | `./deploy.sh` |
| `$1` `$2` ... `${10}` | Arguments | `web`, `3` |
| `$#` | Number of arguments | `3` |
| `"$@"` | All arguments, each as a separate word | `"web" "3" "prod"` |
| `"$*"` | All arguments as one string | `"web 3 prod"` |
| `$?` | Exit status of last command | `0` = success |
| `$$` | PID of the current shell | `48213` |
| `$!` | PID of the last background job | `48250` |

```bash
#!/usr/bin/env bash
echo "Script: $0, args: $#"
for arg in "$@"; do echo "-> $arg"; done
ls /nope 2>/dev/null; echo "ls exit code: $?"
```

### `set` and `shift`

```bash
set -- alpha beta gamma   # replace positional params
echo "$1 $#"              # alpha 3
shift                     # drop $1, everything moves left
echo "$1 $#"              # beta 2
shift 2                   # drop two more
```

`shift` is handy for parsing options in a `while` loop (see [conditions and loops](conditions-and-loops.md)).

## Default values

```bash
env="${1:-staging}"       # use "staging" if $1 is empty
: "${DB_HOST:?DB_HOST must be set}"   # exit with error if unset
echo "${#env}"            # length of the string
```

## Arithmetic

```bash
a=10; b=3
echo $(( a + b ))     # 13
echo $(( a / b ))     # 3   (integer only)
echo $(( a % b ))     # 1
(( a++ )); echo $a    # 11
expr 10 \* 3          # 30  (old style: spaces needed, escape *)
echo "scale=2; 10/3" | bc   # 3.33 (decimals with bc)
```

## Command substitution

Capture a command's output into a variable with `$(...)` (the older backtick form also works but cannot nest easily):

```bash
today=$(date +%F)
files=$(ls | wc -l)
kernel=`uname -r`
echo "On $today there are $files files, kernel $kernel"
```

## Interview questions

**Q1. Difference between `"$@"` and `"$*"`?**
`"$@"` keeps each argument separate (safe for spaces); `"$*"` joins them into one string.

**Q2. What does `$?` hold?**
The exit status of the last command: `0` for success, `1`-`255` for failure.

**Q3. Why is my variable empty in a child script?**
It was not exported. Use `export VAR=value` so child processes inherit it.

**Q4. Why does `x = 5` fail?**
Spaces make the shell run a command named `x`. Write `x=5`.

**Q5. How do you do floating-point math in bash?**
Bash only does integers; use `bc` or `awk`, e.g. `echo "3.5*2" | bc`.
