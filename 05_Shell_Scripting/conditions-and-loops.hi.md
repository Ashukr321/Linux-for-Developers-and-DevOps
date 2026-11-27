# Conditions, Loops और Functions

test, [ ] और [[ ]], if और case, for, while और until loops, break और continue, functions और exit codes, साथ में एक असली disk-usage alert स्क्रिप्ट।

## Exit codes ही conditions की नींव हैं

हर command एक exit status लौटाती है: `0` का मतलब success (true), बाकी कुछ भी failure (false)। `if` और `while` बस यही status जाँचते हैं, जैसे `grep -q root /etc/passwd; echo $?` `0` print करता है।

## `test`, `[ ]` और `[[ ]]`

```bash
[ -f /etc/hosts ] && echo "exists"      # यही है: test -f /etc/hosts ([ ] के अंदर spaces ज़रूरी)
[[ -f /etc/hosts ]] && echo "exists"    # bash keyword: ज़्यादा safe, && || और patterns support
```

bash स्क्रिप्ट में `[[ ]]` को प्राथमिकता दें: यह variables को word-split नहीं करता और `=~` regex तथा `==` glob matching support करता है। POSIX `sh` compatibility चाहिए तो `[ ]` इस्तेमाल करें।

## Operators

| प्रकार | Operator | कब true |
| :--- | :--- | :--- |
| File | `-e file` | फ़ाइल मौजूद है |
| File | `-f file` / `-d dir` | Regular file / directory |
| File | `-r` `-w` `-x file` | Readable / writable / executable |
| File | `-s file` | फ़ाइल मौजूद है और खाली नहीं |
| String | `-z "$s"` / `-n "$s"` | String खाली / खाली नहीं |
| String | `"$a" = "$b"` / `!=` | Strings बराबर / अलग |
| String | `[[ $s == *.log ]]` | Glob match (सिर्फ़ `[[ ]]`) |
| String | `[[ $s =~ ^[0-9]+$ ]]` | Regex match (सिर्फ़ `[[ ]]`) |
| Number | `-eq` `-ne` | बराबर / बराबर नहीं |
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

एक value को कई patterns से match करने के लिए सबसे अच्छा, जैसे स्क्रिप्ट के sub-commands:

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

# while: condition true रहने तक चलता है (फ़ाइल लाइन-दर-लाइन पढ़ें)
while IFS= read -r line; do
    echo "user: ${line%%:*}"
done < /etc/passwd

# until: condition true होने तक चलता है (service का इंतज़ार)
until curl -sf http://localhost:8080/health; do
    echo "waiting..."; sleep 2
done
```

### `break` और `continue`

```bash
for n in {1..10}; do
    (( n % 2 == 0 )) && continue   # even numbers छोड़ें
    (( n > 7 )) && break           # loop रोकें
    echo "$n"                      # 1 3 5 7 print होगा
done
```

## Functions

```bash
log() {
    local level="$1"; shift              # local variable को function के अंदर रखता है
    echo "$(date +%T) [$level] $*"
}

is_root() {
    [[ $EUID -eq 0 ]]                    # function का exit code आख़िरी command का होता है
}

log INFO "starting"
is_root || { log ERROR "run as root"; exit 1; }
```

Functions `return N` (0-255) से status लौटाते हैं। Data लौटाना हो तो उसे `echo` करें और `$(func)` से capture करें।

## Practical स्क्रिप्ट: disk-usage alert

```bash
#!/usr/bin/env bash
# disk-alert.sh - कोई filesystem threshold से ऊपर हो तो चेतावनी
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

इसे cron से हर 15 मिनट चलाएँ ([scheduling](../03_Processes/scheduling.md) देखें), और `df` के बारे में [disks and mounting](../07_System_Administration/disks-and-mounting.md) में और पढ़ें।

## इंटरव्यू प्रश्न

**Q1. `[ ]` और `[[ ]]` में अंतर?**
`[` एक command है (POSIX); `[[` एक bash keyword है जो word splitting से बचाता है और `=~`, `==` patterns, `&&` और `||` जोड़ता है।

**Q2. `$a` खाली होने पर `[ $a == $b ]` fail क्यों होता है?**
यह `[ == x ]` बन जाता है, जो syntax error है। Variables quote करें: `[ "$a" = "$b" ]`, या `[[ ]]` इस्तेमाल करें।

**Q3. `while` बनाम `until`?**
`while` condition true रहने तक दोहराता है; `until` condition false रहने तक दोहराता है।

**Q4. Function value कैसे लौटाता है?**
`return` सिर्फ़ exit status (0-255) set करता है; value को `echo` से print करें और `$(...)` से capture करें।

**Q5. `[ ]` के अंदर `>` की जगह `-gt` क्यों?**
`[ ]` के अंदर `>` output redirection है। `-gt` इस्तेमाल करें, या arithmetic के लिए `(( a > b ))`।
