# Text Processing ke liye Regular Expressions

Regular expressions search patterns hain jinse grep, sed aur awk logs, configs aur command output mein text dhoondhte, filter aur change karte hain.

## Regex kyun zaroori hai

Logs, config files, CSV exports aur command output sab plain text hain. Regular expression (regex) text ka ek *pattern* batata hai, isliye ek hi command har IP address, har `ERROR` line ya har commented setting dhoondh sakti hai. `grep`, `sed`, `awk`, `vi` aur zyadatar programming languages regex samajhti hain.

## BRE vs ERE

Unix tools do tarah ke regex support karte hain:

| Feature | BRE (Basic) | ERE (Extended) |
| :--- | :--- | :--- |
| Default mein use hota hai | `grep`, `sed` | `grep -E`, `sed -E`, `awk` |
| Ek ya zyada | `\+` (GNU) | `+` |
| Zero ya ek | `\?` (GNU) | `?` |
| Alternation | `\\|` (GNU) | `\|` |
| Grouping | `\( \)` | `( )` |
| Repetition count | `\{2,4\}` | `{2,4}` |

ERE mein special characters bina backslash ke kaam karte hain, isliye patterns padhna aasaan hota hai. Thode bhi complex kaam ke liye `grep -E` aur `sed -E` use karo.

## Building Blocks

### Anchors

| Pattern | Matlab | Example |
| :--- | :--- | :--- |
| `^` | Line ki shuruaat | `^#` woh lines jo `#` se shuru hon |
| `$` | Line ka end | `;$` woh lines jo `;` pe khatam hon |
| `^$` | Khaali line | `grep -v '^$'` blank lines hata deta hai |
| `\b` | Word boundary (GNU) | `\berror\b` sirf poora word match karta hai |

### Character Classes

| Pattern | Kisse match karta hai |
| :--- | :--- |
| `.` | Koi bhi ek character |
| `[abc]` | `a`, `b`, `c` mein se ek |
| `[^abc]` | `a`, `b`, `c` ke alawa koi bhi character |
| `[0-9]` | Ek digit |
| `[[:digit:]]` | Ek digit (POSIX class, locale safe) |
| `[[:alpha:]]` | Ek letter |
| `[[:space:]]` | Space, tab, newline |

### Quantifiers (ERE)

| Pattern | Matlab |
| :--- | :--- |
| `*` | Pichhle item ke 0 ya zyada |
| `+` | 1 ya zyada |
| `?` | 0 ya 1 |
| `{3}` | Exactly 3 |
| `{2,5}` | 2 se 5 ke beech |

### Groups aur Alternation

`( )` items ko group karta hai taaki quantifier sab pe lage, aur `|` ka matlab "ya" hai. sed mein groups ko replacement mein `\1`, `\2` ke roop mein dobara use kar sakte ho.

## grep -E Examples

```bash
# Lines with ERROR or WARN
grep -E 'ERROR|WARN' app.log

# Count HTTP 5xx responses in an nginx log
grep -cE '" 5[0-9]{2} ' /var/log/nginx/access.log

# Find IPv4-looking addresses
grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' access.log | sort -u

# Active settings only: skip comments and blank lines
grep -Ev '^[[:space:]]*(#|$)' /etc/ssh/sshd_config

# Whole word, case-insensitive, with line numbers
grep -inw 'timeout' config.yaml
```

Sample output:

```bash
$ grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' access.log | sort -u
10.0.0.5
192.168.1.20
```

## grep vs sed vs awk

| Tool | Kiske liye best | Typical use |
| :--- | :--- | :--- |
| `grep` | Matching lines dhoondhna | `grep -E 'ERROR\|FATAL' app.log` |
| `sed` | Line by line text edit karna (replace, delete, insert) | `sed -i 's/8080/9090/' app.conf` |
| `awk` | Columns, counting aur reports | `awk '{print $1}' access.log` |

Simple rule: grep se **dhoondho**, sed se **badlo**, awk se **calculate karo**. Ye teeno [pipes](../04_Commands/filters-and-pipes.md) mein saath mein badhiya kaam karte hain.

## Is Section ke Notes

- [sed: stream editor](sed.md)
- [awk: fields, patterns aur reports](awk.md)

## Common Mistakes

**Q: `grep 'a+'` expected tarah se `aaa` match kyun nahi karta?**
A: BRE mein `+` ek literal plus hai. `grep -E 'a+'` (ya GNU BRE mein `a\+`) use karo.

**Q: `grep '.'` har line ko match kyun karta hai?**
A: `.` ka matlab koi bhi character hai. Literal dot ke liye `\.` likho, jaise `grep '\.conf$'`.

**Q: Patterns ko single quotes mein kyun rakhein?**
A: Quotes ke bina shell `*`, `$` aur `?` ko grep tak pahunchne se pehle hi expand kar deta hai.

**Q: Kya `[0-9]{1,3}` ek strict IP validator hai?**
A: Nahi, ye `999` ko bhi match karta hai. Logs se IP nikalne ke liye theek hai, input validate karne ke liye nahi.
