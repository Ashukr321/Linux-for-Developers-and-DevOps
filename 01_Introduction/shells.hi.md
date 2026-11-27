# Unix Shells

Shell आपके और kernel के बीच का command interpreter है। sh, bash, ksh, csh और zsh की तुलना करें और देखें shell command कैसे चलाता है।

![Shell scripting overview](../unix-shell-scripting%20(1).png)

## Shell क्या है

Shell एक user-space प्रोग्राम है जो commands पढ़ता है, उनका अर्थ निकालता है और kernel से प्रोग्राम चलवाता है। यह दोनों है:

- एक **interactive command line** (आप टाइप करते हैं, वह चलाता है), और
- scripts के लिए एक **programming language** (variables, `if`, loops)। देखें [shell scripting](../05_Shell_Scripting/README.md)।

## मुख्य shells

| Shell | Binary | लेखक / वर्ष | Prompt | टिप्पणी |
| :--- | :--- | :--- | :---: | :--- |
| Bourne shell | `/bin/sh` | Stephen Bourne, Bell Labs, 1979 | `$` | मूल shell; POSIX `sh` का आधार |
| C shell | `/bin/csh` | Bill Joy, BSD, 1978 | `%` | C जैसा syntax, history और aliases लाया |
| Korn shell | `/bin/ksh` | David Korn, Bell Labs, 1983 | `$` | Bourne-compatible और csh की खूबियाँ; AIX पर आम |
| Bash | `/bin/bash` | Brian Fox, GNU, 1989 | `$` | "Bourne Again SHell"; ज़्यादातर Linux distros का डिफ़ॉल्ट |
| Z shell | `/bin/zsh` | Paul Falstad, 1990 | `%` | बेहतरीन completion और themes; 2019 से macOS का डिफ़ॉल्ट |

Root user का prompt आमतौर पर हर shell में `#` होता है।

Debian/Ubuntu पर `/bin/sh` असल में `dash` है, एक छोटा और तेज़ POSIX shell। `#!/bin/sh` वाली scripts में bash-only features इस्तेमाल नहीं करने चाहिए।

## अपना shell जाँचें और बदलें

```bash
echo $SHELL          # your login shell
echo $0              # the shell running right now
cat /etc/shells      # shells allowed for login
```

नमूना आउटपुट:

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

Login shell `chsh` से बदलें (अगले login से लागू होता है):

```bash
chsh -s /usr/bin/zsh            # change your own shell
sudo chsh -s /bin/bash alice    # change another user's shell
grep alice /etc/passwd          # the last field is the login shell
```

```text
alice:x:1001:1001:Alice:/home/alice:/bin/bash
```

## Shell command कैसे execute करता है

`ls -l *.txt > out.txt` जैसी line के लिए:

1. **Read**: terminal या script से line पढ़ना।
2. **Tokenize**: उसे words और operators में तोड़ना (`ls`, `-l`, `*.txt`, `>`, `out.txt`)।
3. **Expand**: variables (`$HOME`), command substitution (`$(date)`), wildcards (`*.txt` बन जाता है `a.txt b.txt`)।
4. **Redirection और pipes तैयार करना** (`>`, `<`, `|`)। देखें [redirection](../04_Commands/redirection.md)।
5. **Command ढूँढना**: alias, फिर shell function, फिर **builtin** (`cd`, `echo`), फिर `$PATH` में **external** प्रोग्राम।
6. **चलाना**: external प्रोग्राम के लिए shell `fork()` से child बनाता है, child `exec()` से प्रोग्राम load करता है, और parent `wait()` करता है।
7. **Exit status** `$?` में सहेजना और अगला prompt दिखाना।

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

`cd` का builtin होना ज़रूरी है: child process अपने parent shell की working directory नहीं बदल सकता।

## Login बनाम non-login, interactive बनाम script

| प्रकार | कौन शुरू करता है | Startup files (bash) |
| :--- | :--- | :--- |
| Login shell | SSH, console login, `bash -l` | `/etc/profile`, `~/.bash_profile` |
| Interactive non-login | नया terminal tab | `~/.bashrc` |
| Non-interactive | Script चलाना | कोई नहीं (सिर्फ़ `$BASH_ENV`) |

## आम गलतियाँ

**Q1. मेरी script bash में चलती है लेकिन `sh script.sh` से fail होती है। क्यों?**
`sh` शायद `dash` है, जिसमें `[[ ]]` या arrays जैसे bash features नहीं हैं। `#!/bin/bash` इस्तेमाल करें और `./script.sh` या `bash script.sh` से चलाएँ।

**Q2. मैंने `chsh` चलाया लेकिन `echo $SHELL` अभी भी पुराना shell दिखा रहा है।**
`$SHELL` login के समय सेट होता है। Logout करके दोबारा login करें।

**Q3. मैंने `chsh` में गलत path दिया और अब login नहीं हो रहा।**
Path मौजूद होना चाहिए और `/etc/shells` में लिखा होना चाहिए। Root से `chsh -s /bin/bash user` चलाकर ठीक करें।

**Q4. `$SHELL` और `$0` में क्या अंतर है?**
`$SHELL` `/etc/passwd` से आपका login shell है; `$0` अभी चल रहा shell (या script) है।
