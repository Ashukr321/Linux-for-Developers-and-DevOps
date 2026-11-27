# Unix Shells

Shell aapke aur kernel ke beech ka command interpreter hai. sh, bash, ksh, csh aur zsh compare karein aur dekhein shell command kaise chalata hai.

![Shell scripting overview](../unix-shell-scripting%20(1).png)

## Shell kya hai

Shell ek user-space program hai jo commands padhta hai, unhe interpret karta hai aur kernel se programs chalwata hai. Yeh dono hai:

- ek **interactive command line** (aap type karte ho, woh chalata hai), aur
- scripts ke liye ek **programming language** (variables, `if`, loops). Dekhein [shell scripting](../05_Shell_Scripting/README.md).

## Main shells

| Shell | Binary | Author / saal | Prompt | Notes |
| :--- | :--- | :--- | :---: | :--- |
| Bourne shell | `/bin/sh` | Stephen Bourne, Bell Labs, 1979 | `$` | Original shell; POSIX `sh` ka base |
| C shell | `/bin/csh` | Bill Joy, BSD, 1978 | `%` | C jaisa syntax, history aur aliases laaya |
| Korn shell | `/bin/ksh` | David Korn, Bell Labs, 1983 | `$` | Bourne-compatible plus csh features; AIX par common |
| Bash | `/bin/bash` | Brian Fox, GNU, 1989 | `$` | "Bourne Again SHell"; zyadatar Linux distros ka default |
| Z shell | `/bin/zsh` | Paul Falstad, 1990 | `%` | Rich completion aur themes; 2019 se macOS ka default |

Root user ka prompt aam taur par har shell mein `#` hota hai.

Debian/Ubuntu par `/bin/sh` asal mein `dash` hai, ek chhota aur fast POSIX shell. `#!/bin/sh` wali scripts mein bash-only features use nahi karne chahiye.

## Apna shell check aur change karein

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

Login shell `chsh` se badlein (agle login se lagu hota hai):

```bash
chsh -s /usr/bin/zsh            # change your own shell
sudo chsh -s /bin/bash alice    # change another user's shell
grep alice /etc/passwd          # the last field is the login shell
```

```text
alice:x:1001:1001:Alice:/home/alice:/bin/bash
```

## Shell command kaise execute karta hai

`ls -l *.txt > out.txt` jaisi line ke liye:

1. **Read**: terminal ya script se line padhna.
2. **Tokenize**: use words aur operators mein todna (`ls`, `-l`, `*.txt`, `>`, `out.txt`).
3. **Expand**: variables (`$HOME`), command substitution (`$(date)`), wildcards (`*.txt` ban jaata hai `a.txt b.txt`).
4. **Redirection aur pipes set up karna** (`>`, `<`, `|`). Dekhein [redirection](../04_Commands/redirection.md).
5. **Command dhoondhna**: alias, phir shell function, phir **builtin** (`cd`, `echo`), phir `$PATH` mein **external** program.
6. **Chalana**: external program ke liye shell `fork()` se child banata hai, child `exec()` se program load karta hai, aur parent `wait()` karta hai.
7. **Exit status** `$?` mein save karna aur agla prompt dikhana.

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

`cd` ka builtin hona zaruri hai: child process apne parent shell ki working directory nahi badal sakta.

## Login vs non-login, interactive vs script

| Type | Kaun start karta hai | Startup files (bash) |
| :--- | :--- | :--- |
| Login shell | SSH, console login, `bash -l` | `/etc/profile`, `~/.bash_profile` |
| Interactive non-login | Naya terminal tab | `~/.bashrc` |
| Non-interactive | Script chalana | koi nahi (sirf `$BASH_ENV`) |

## Common mistakes

**Q1. Meri script bash mein chalti hai lekin `sh script.sh` se fail hoti hai. Kyun?**
`sh` shayad `dash` hai, jisme `[[ ]]` ya arrays jaise bash features nahi hain. `#!/bin/bash` use karein aur `./script.sh` ya `bash script.sh` se chalayein.

**Q2. Maine `chsh` chalaya lekin `echo $SHELL` abhi bhi purana shell dikha raha hai.**
`$SHELL` login ke time set hota hai. Logout karke dobara login karein.

**Q3. Maine `chsh` mein galat path diya aur ab login nahi ho raha.**
Path exist karna chahiye aur `/etc/shells` mein listed hona chahiye. Root se `chsh -s /bin/bash user` chala ke fix karein.

**Q4. `$SHELL` aur `$0` mein kya fark hai?**
`$SHELL` `/etc/passwd` se aapka login shell hai; `$0` abhi chal raha shell (ya script) hai.
