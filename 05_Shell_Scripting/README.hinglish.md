# Shell Scripting ki Basics

Jaaniye shell script kya hai, shebang aur execute permission kaise kaam karte hain, script chalane ke tareeke, aur set -euo pipefail kyun zaroori hai.

![Unix shell scripting overview](../unix-shell-scripting%20%281%29.png)

## Shell script kya hai?

Shell script ek simple text file hai jisme commands likhi hoti hain, aur shell unhe ek ke baad ek chalata hai. Jo kuch aap prompt par type kar sakte ho, woh sab script mein ja sakta hai: `cd`, `cp`, pipes, loops, conditions aur functions. Script baar-baar hone wale kaam (backup, deployment, log cleanup, health check) ko ek repeatable command mein badal deti hai.

DevOps mein shell scripts har jagah milti hain: Docker `ENTRYPOINT` scripts, CI/CD pipeline steps, cron jobs aur server bootstrap (`user_data`) scripts. `sh`, `bash`, `ksh` aur `zsh` ka difference [shells](../01_Introduction/shells.md) mein dekhiye.

## Shebang line

Script ki pehli line kernel ko batati hai ki kaunsa interpreter use chalayega:

```bash
#!/bin/bash              # hamesha is path wala bash use karo
#!/usr/bin/env bash      # $PATH mein bash dhoondo (zyada portable: macOS, NixOS, containers)
#!/bin/sh                # sirf POSIX sh (Debian/Ubuntu par dash, bash features nahi)
```

Shebang ke bina file aapke current shell se chalti hai, jiska behaviour alag ho sakta hai.

## Script ko executable banana

Nayi file by default executable nahi hoti. `chmod` se execute bit add karo ([permissions](../02_Filesystem/permissions.md) dekhiye):

```bash
$ ls -l hello.sh
-rw-r--r-- 1 dev dev 45 Nov 27 10:00 hello.sh
$ chmod +x hello.sh
$ ls -l hello.sh
-rwxr-xr-x 1 dev dev 45 Nov 27 10:00 hello.sh
```

## Script chalane ke tareeke

| Command | Naya process? | `+x` chahiye? | Shebang use hota hai? | Common use |
| :--- | :---: | :---: | :---: | :--- |
| `./script.sh` | Haan | Haan | Haan | Script chalane ka normal tareeka |
| `bash script.sh` | Haan | Nahi | Nahi (bash forced) | Jaldi run karna, `bash -x` se debugging |
| `source script.sh` ya `. script.sh` | Nahi (current shell) | Nahi | Nahi | Variables/functions load karna, jaise `source ~/.bashrc` |

Main difference: `source` file ko aapke current shell ke andar chalata hai, isliye uske andar ke `cd` aur `export` aapka session badal dete hain. `./script.sh` ek child process mein chalta hai, aur exit hote hi uske changes khatam ho jaate hain.

```bash
$ cat setenv.sh
export APP_ENV=production
$ ./setenv.sh && echo "$APP_ENV"     # khaali line print hoti hai
$ source setenv.sh && echo "$APP_ENV"
production
```

`./` kyun? Security ke liye current directory `$PATH` mein nahi hoti, isliye path explicitly dena padta hai.

## Strict mode: `set -euo pipefail`

By default bash kisi command ke fail hone par bhi aage chalta rehta hai. Production mein yeh dangerous hai: fail hua `cd` aur uske baad `rm -rf *` galat directory delete kar sakta hai. Ise har script ke top par likho:

| Option | Effect |
| :--- | :--- |
| `set -e` | Koi command non-zero status return kare to turant exit |
| `set -u` | Unset variable ka use error maana jaaye |
| `set -o pipefail` | Pipeline mein koi bhi command fail ho to poori pipeline fail, sirf last wali nahi |
| `set -x` | (Debug) har command chalane se pehle print karo |

```bash
$ bash -c 'false | true; echo "status=$?"'
status=0
$ bash -c 'set -o pipefail; false | true; echo "status=$?"'
status=1
```

## Ek complete chhoti script

`backup.sh` kisi directory ko date-stamp wale naam ke saath `/tmp/backups` mein archive karti hai:

```bash
#!/usr/bin/env bash
# backup.sh - timestamp ke saath directory ka archive
set -euo pipefail

SRC="${1:-$HOME/projects}"          # pehla argument, ya default
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

Ise cron se har raat chalao ([scheduling](../03_Processes/scheduling.md) dekhiye): `0 2 * * * /home/dev/backup.sh`.

## Aage kya

- [vi editor](vi-editor.md) — kisi bhi server par scripts likho aur edit karo
- [Variables](variables.md) — variables, arguments aur arithmetic
- [Conditions and loops](conditions-and-loops.md) — `if`, `case`, `for`, `while` aur functions

## Interview questions

**Q1. `./script.sh` aur `source script.sh` mein kya difference hai?**
`./script.sh` ek naye child shell mein chalta hai; `source` current shell mein chalta hai, isliye variable, `cd` aur `export` ke changes bane rehte hain.

**Q2. Shebang kya karta hai?**
Jab file directly run hoti hai, to yeh kernel ko batata hai ki kaunsa interpreter use karna hai, jaise `#!/bin/bash`.

**Q3. `./deploy.sh` chalane par "Permission denied" aata hai. Kyun?**
File mein execute bit nahi hai. `chmod +x deploy.sh` se fix karo, ya `bash deploy.sh` se chalao.

**Q4. `set -euo pipefail` kyun use karein?**
Isse script errors, unset variables aur pipeline ke andar ki failures par ruk jaati hai, chupchaap aage nahi badhti.

**Q5. Script ko debug kaise karein?**
`bash -x script.sh` chalao ya `set -x` add karo, jisse har command apne expanded arguments ke saath print hoti hai.
