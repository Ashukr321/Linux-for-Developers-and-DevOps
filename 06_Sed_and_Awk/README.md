# Regular Expressions for Text Processing

Regular expressions are search patterns used by grep, sed and awk to find, filter and transform text in logs, configs and command output.

## Why Regex Matters

Logs, config files, CSV exports and command output are all plain text. A regular expression (regex) describes a *pattern* of text, so one command can find every IP address, every `ERROR` line or every commented setting. `grep`, `sed`, `awk`, `vi` and most programming languages understand regex.

## BRE vs ERE

Unix tools support two regex flavours:

| Feature | BRE (Basic) | ERE (Extended) |
| :--- | :--- | :--- |
| Used by default in | `grep`, `sed` | `grep -E`, `sed -E`, `awk` |
| One or more | `\+` (GNU) | `+` |
| Zero or one | `\?` (GNU) | `?` |
| Alternation | `\\|` (GNU) | `\|` |
| Grouping | `\( \)` | `( )` |
| Repetition count | `\{2,4\}` | `{2,4}` |

In ERE the special characters work without a backslash, which makes patterns easier to read. Prefer `grep -E` and `sed -E` for anything non-trivial.

## Building Blocks

### Anchors

| Pattern | Meaning | Example |
| :--- | :--- | :--- |
| `^` | Start of line | `^#` lines that start with `#` |
| `$` | End of line | `;$` lines that end with `;` |
| `^$` | Empty line | `grep -v '^$'` removes blank lines |
| `\b` | Word boundary (GNU) | `\berror\b` matches the word only |

### Character Classes

| Pattern | Matches |
| :--- | :--- |
| `.` | Any single character |
| `[abc]` | One of `a`, `b`, `c` |
| `[^abc]` | Any character except `a`, `b`, `c` |
| `[0-9]` | A digit |
| `[[:digit:]]` | A digit (POSIX class, locale safe) |
| `[[:alpha:]]` | A letter |
| `[[:space:]]` | Space, tab, newline |

### Quantifiers (ERE)

| Pattern | Meaning |
| :--- | :--- |
| `*` | 0 or more of the previous item |
| `+` | 1 or more |
| `?` | 0 or 1 |
| `{3}` | Exactly 3 |
| `{2,5}` | Between 2 and 5 |

### Groups and Alternation

`( )` groups items so a quantifier applies to all of them, and `|` means "or". In sed, groups can be reused in the replacement as `\1`, `\2`.

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

| Tool | Best for | Typical use |
| :--- | :--- | :--- |
| `grep` | Finding lines that match | `grep -E 'ERROR\|FATAL' app.log` |
| `sed` | Editing text line by line (replace, delete, insert) | `sed -i 's/8080/9090/' app.conf` |
| `awk` | Working with columns, counting, reports | `awk '{print $1}' access.log` |

Rule of thumb: **find** with grep, **change** with sed, **calculate** with awk. They combine well in [pipes](../04_Commands/filters-and-pipes.md).

## Notes in This Section

- [sed: the stream editor](sed.md)
- [awk: fields, patterns and reports](awk.md)

## Common Mistakes

**Q: Why does `grep 'a+'` not match `aaa` as expected?**
A: In BRE `+` is a literal plus. Use `grep -E 'a+'` (or `a\+` in GNU BRE).

**Q: Why does `grep '.'` match every line?**
A: `.` means any character. Escape it as `\.` to match a literal dot, for example `grep '\.conf$'`.

**Q: Why use single quotes around patterns?**
A: Without them the shell expands `*`, `$` and `?` before grep sees the pattern.

**Q: Is `[0-9]{1,3}` a strict IP validator?**
A: No, it also matches `999`. It is fine for extracting IPs from logs, not for validating input.
