# Conditions, Loops aur Functions

test, [ ] aur [[ ]], if aur case, for, while aur until loops, break aur continue, functions aur exit codes, saath mein ek real disk-usage alert script.

## Exit codes hi conditions ki neev hain

Har command ek exit status return karti hai: `0` ka matlab success (true), baaki kuch bhi failure (false). `if` aur `while` bas yahi status check karte hain, jaise `grep -q root /etc/passwd; echo $?` `0` print karta hai.

## `test`, `[ ]` aur `[[ ]]`

```bash
[ -f /etc/hosts ] && echo "exists"      # same as: test -f /etc/hosts ([ ] ke andar spaces zaroori)
[[ -f /etc/hosts ]] && echo "exists"    # bash keyword: zyada safe, && || aur patterns support
```

bash scripts mein `[[ ]]` prefer karo: yeh variables ko word-split nahi karta aur `=~` regex aur `==` glob matching support karta hai. POSIX `sh` compatibility chahiye to `[ ]` use karo.

## Operators

| Type | Operator | Kab true |
| :--- | :--- | :--- |
| File | `-e file` | File exist karti hai |
| File | `-f file` / `-d dir` | Regular file / directory |
| File | `-r` `-w` `-x file` | Readable / writable / executable |
| File | `-s file` | File exist karti hai aur khaali nahi |
| String | `-z "$s"` / `-n "$s"` | String khaali / khaali nahi |
| String | `"$a" = "$b"` / `!=` | Strings equal / different |
| String | `[[ $s == *.log ]]` | Glob match (sirf `[[ ]]`) |
| String | `[[ $s =~ ^[0-9]+$ ]]` | Regex match (sirf `[[ ]]`) |
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

Ek value ko kai patterns se match karne ke liye best, jaise script ke sub-commands:

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

# while: condition true rehne tak chalta hai (file line-by-line padho)
while IFS= read -r line; do
    echo "user: ${line%%:*}"
done < /etc/passwd

# until: condition true hone tak chalta hai (service ka wait)
until curl -sf http://localhost:8080/health; do
    echo "waiting..."; sleep 2
done
```

### `break` aur `continue`

```bash
for n in {1..10}; do
    (( n % 2 == 0 )) && continue   # even numbers skip karo
    (( n > 7 )) && break           # loop roko
    echo "$n"                      # 1 3 5 7 print hoga
done
```

## Functions

```bash
log() {
    local level="$1"; shift              # local variable ko function ke andar rakhta hai
    echo "$(date +%T) [$level] $*"
}

is_root() {
    [[ $EUID -eq 0 ]]                    # function ka exit code last command ka hota hai
}

log INFO "starting"
is_root || { log ERROR "run as root"; exit 1; }
```

Functions `return N` (0-255) se status return karte hain. Data return karna ho to use `echo` karo aur `$(func)` se capture karo.

## Practical script: disk-usage alert

```bash
#!/usr/bin/env bash
# disk-alert.sh - koi filesystem threshold se upar ho to warning
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

Ise cron se har 15 minute chalao ([scheduling](../03_Processes/scheduling.md) dekhiye), aur `df` ke baare mein [disks and mounting](../07_System_Administration/disks-and-mounting.md) mein aur padho.

## Interview questions

**Q1. `[ ]` aur `[[ ]]` mein difference?**
`[` ek command hai (POSIX); `[[` ek bash keyword hai jo word splitting se bachata hai aur `=~`, `==` patterns, `&&` aur `||` add karta hai.

**Q2. `$a` khaali hone par `[ $a == $b ]` fail kyun hota hai?**
Yeh `[ == x ]` ban jaata hai, jo syntax error hai. Variables quote karo: `[ "$a" = "$b" ]`, ya `[[ ]]` use karo.

**Q3. `while` vs `until`?**
`while` condition true rehne tak repeat karta hai; `until` condition false rehne tak repeat karta hai.

**Q4. Function value kaise return karta hai?**
`return` sirf exit status (0-255) set karta hai; value ko `echo` se print karo aur `$(...)` se capture karo.

**Q5. `[ ]` ke andar `>` ki jagah `-gt` kyun?**
`[ ]` ke andar `>` output redirection hai. `-gt` use karo, ya arithmetic ke liye `(( a > b ))`.
