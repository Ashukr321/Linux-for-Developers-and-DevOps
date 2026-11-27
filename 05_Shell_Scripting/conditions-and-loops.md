# Conditions, Loops and Functions

Use test, [ ] and [[ ]], if and case, for, while and until loops, break and continue, functions and exit codes, with a real disk-usage alert script.

## Exit codes are the basis of conditions

Every command returns an exit status: `0` means success (true), anything else means failure (false). `if` and `while` simply check that status, e.g. `grep -q root /etc/passwd; echo $?` prints `0`.

## `test`, `[ ]` and `[[ ]]`

```bash
[ -f /etc/hosts ] && echo "exists"      # same as: test -f /etc/hosts (spaces inside [ ] are required)
[[ -f /etc/hosts ]] && echo "exists"    # bash keyword: safer, supports && || and patterns
```

Prefer `[[ ]]` in bash scripts: it does not word-split variables and supports `=~` regex and `==` glob matching. Use `[ ]` when you need POSIX `sh` compatibility.

## Operators

| Type | Operator | True when |
| :--- | :--- | :--- |
| File | `-e file` | File exists |
| File | `-f file` / `-d dir` | Regular file / directory |
| File | `-r` `-w` `-x file` | Readable / writable / executable |
| File | `-s file` | File exists and is not empty |
| String | `-z "$s"` / `-n "$s"` | String is empty / not empty |
| String | `"$a" = "$b"` / `!=` | Strings equal / differ |
| String | `[[ $s == *.log ]]` | Glob match (`[[ ]]` only) |
| String | `[[ $s =~ ^[0-9]+$ ]]` | Regex match (`[[ ]]` only) |
| Number | `-eq` `-ne` | Equal / not equal |
| Number | `-lt` `-le` `-gt` `-ge` | `<` `<=` `>` `>=` |
| Logic | `!` / `&&` / `\|\|` | Not / and / or |

## `if` / `elif` / `else`

```bash
read -p "Enter a number: " n
if [[ $n -gt 0 ]]; then
    echo "positive"
elif [[ $n -lt 0 ]]; then
    echo "negative"
else
    echo "zero"
fi
```

## `case`

Best for matching one value against several patterns, such as script sub-commands:

```bash
case "$1" in
    start)        systemctl start nginx ;;
    stop)         systemctl stop nginx ;;
    restart|reload) systemctl reload nginx ;;
    *)            echo "Usage: $0 {start|stop|restart}"; exit 1 ;;
esac
```

## Loops

```bash
for host in web1 web2 db1; do ping -c1 "$host" >/dev/null && echo "$host up"; done
for f in /var/log/*.log; do echo "$f: $(wc -l < "$f") lines"; done

# while: runs while the condition is true (read a file line by line)
while IFS= read -r line; do
    echo "user: ${line%%:*}"
done < /etc/passwd

# until: runs until the condition becomes true (wait for a service)
until curl -sf http://localhost:8080/health; do
    echo "waiting..."; sleep 2
done
```

### `break` and `continue`

```bash
for n in {1..10}; do
    (( n % 2 == 0 )) && continue   # skip even numbers
    (( n > 7 )) && break           # stop the loop
    echo "$n"                      # prints 1 3 5 7
done
```

## Functions

```bash
log() {
    local level="$1"; shift              # local keeps the variable inside the function
    echo "$(date +%T) [$level] $*"
}

is_root() {
    [[ $EUID -eq 0 ]]                    # the function's exit code is the last command's
}

log INFO "starting"
is_root || { log ERROR "run as root"; exit 1; }
```

Functions return a status with `return N` (0-255). To return data, `echo` it and capture with `$(func)`.

## Practical script: disk-usage alert

```bash
#!/usr/bin/env bash
# disk-alert.sh - warn when any filesystem is above a threshold
set -euo pipefail

THRESHOLD="${1:-80}"
status=0

while read -r usage mount; do
    pct="${usage%\%}"                    # "91%" -> "91"
    if (( pct >= THRESHOLD )); then
        echo "ALERT: $mount is ${pct}% full"
        status=2
    fi
done < <(df -P --output=pcent,target -x tmpfs -x devtmpfs | tail -n +2)

(( status == 0 )) && echo "OK: all filesystems below ${THRESHOLD}%"
exit "$status"
```

```bash
$ ./disk-alert.sh 70; echo "exit=$?"
ALERT: / is 91% full
exit=2
```

Run it every 15 minutes from cron (see [scheduling](../03_Processes/scheduling.md)), and learn more about `df` in [disks and mounting](../07_System_Administration/disks-and-mounting.md).

## Interview questions

**Q1. Difference between `[ ]` and `[[ ]]`?**
`[` is a command (POSIX); `[[` is a bash keyword that avoids word splitting and adds `=~`, `==` patterns, `&&` and `||`.

**Q2. Why does `[ $a == $b ]` fail when `$a` is empty?**
It becomes `[ == x ]`, a syntax error. Quote variables: `[ "$a" = "$b" ]`, or use `[[ ]]`.

**Q3. `while` vs `until`?**
`while` repeats while the condition is true; `until` repeats while it is false.

**Q4. How does a function return a value?**
`return` only sets an exit status (0-255); print the value with `echo` and capture it with `$(...)`.

**Q5. Why is `-gt` used instead of `>` inside `[ ]`?**
Inside `[ ]`, `>` is output redirection. Use `-gt`, or `(( a > b ))` for arithmetic.
