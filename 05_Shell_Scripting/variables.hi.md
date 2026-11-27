# Variables, Input और Arithmetic

Shell variables, quoting के नियम, environment variables और export, read/echo/printf, positional parameters, set और shift, arithmetic और command substitution।

## Variables बनाना और इस्तेमाल करना

```bash
name="Ashu"            # = के आस-पास space नहीं
count=5
echo "$name has $count servers"
echo "${name}_backup"  # braces नाम को आगे के टेक्स्ट से अलग करते हैं
unset count            # variable हटाएँ
readonly PI=3.14       # बाद में बदला नहीं जा सकता
```

Variables का कोई type नहीं होता, सब strings हैं। नाम में letters, digits और `_` हो सकते हैं, पर नाम digit से शुरू नहीं हो सकता। परंपरा के अनुसार environment variables `UPPERCASE` में और स्क्रिप्ट के local variables `lowercase` में होते हैं।

## Quoting के नियम

| Quote | Variables expand? | उदाहरण | Output |
| :--- | :---: | :--- | :--- |
| Double `"..."` | हाँ | `echo "Home: $HOME"` | `Home: /home/dev` |
| Single `'...'` | नहीं | `echo 'Home: $HOME'` | `Home: $HOME` |
| Backslash `\` | एक char escape | `echo "Cost: \$5"` | `Cost: $5` |
| कोई नहीं | हाँ, साथ में word splitting और globbing | `echo $file` | Spaces पर टूट जाता है |

नियम: variables को हमेशा double quotes में रखें (`"$file"`), ताकि spaces वाले file names स्क्रिप्ट न तोड़ें।

## Environment variables और `export`

साधारण variable सिर्फ़ मौजूदा शेल में रहता है। `export` उसे environment variable बना देता है, जो हर child process में copy होता है।

```bash
$ APP_ENV=dev
$ bash -c 'echo "child sees: $APP_ENV"'
child sees:
$ export APP_ENV=dev
$ bash -c 'echo "child sees: $APP_ENV"'
child sees: dev
$ PORT=8080 node server.js     # सिर्फ़ एक command के लिए variable set करें
```

आम variables: `HOME`, `USER`, `PATH`, `PWD`, `SHELL`, `LANG`। इन्हें `env` या `printenv` से देखें; हमेशा के लिए `~/.bashrc` या `~/.profile` में जोड़ें।

```bash
export PATH="$HOME/bin:$PATH"   # अपनी scripts की directory PATH में जोड़ें
```

## Input और output: `read`, `echo`, `printf`

```bash
read -p "Enter your name: " user          # prompt दिखाकर एक लाइन पढ़ें
read -sp "Password: " pass; echo          # -s typing छिपाता है
read -t 10 -p "Continue? (y/n) " ans      # 10 सेकंड बाद time out
echo "Hello, $user"
echo -e "Line1\nLine2"                     # -e से \n \t जैसे escapes चलते हैं
printf "%-10s %5d\n" "nginx" 42            # formatted, portable output
```

अलग-अलग शेल में `printf` का व्यवहार `echo` से ज़्यादा भरोसेमंद है; formatted output के लिए इसे चुनें।

## Positional parameters और special variables

`./deploy.sh web 3 prod` के रूप में चलाने पर:

| Variable | मतलब | Value |
| :--- | :--- | :--- |
| `$0` | स्क्रिप्ट का नाम | `./deploy.sh` |
| `$1` `$2` ... `${10}` | Arguments | `web`, `3` |
| `$#` | Arguments की संख्या | `3` |
| `"$@"` | सारे arguments, हर एक अलग word | `"web" "3" "prod"` |
| `"$*"` | सारे arguments एक string में | `"web 3 prod"` |
| `$?` | पिछली command का exit status | `0` = success |
| `$$` | मौजूदा शेल का PID | `48213` |
| `$!` | आख़िरी background job का PID | `48250` |

```bash
#!/usr/bin/env bash
echo "Script: $0, args: $#"
for arg in "$@"; do echo "-> $arg"; done
ls /nope 2>/dev/null; echo "ls exit code: $?"
```

### `set` और `shift`

```bash
set -- alpha beta gamma   # positional params बदलें
echo "$1 $#"              # alpha 3
shift                     # $1 हटाएँ, बाकी सब बाएँ खिसकते हैं
echo "$1 $#"              # beta 2
shift 2                   # दो और हटाएँ
```

`while` loop में options parse करने के लिए `shift` बहुत काम का है ([conditions and loops](conditions-and-loops.md) देखें)।

## Default values

```bash
env="${1:-staging}"       # $1 खाली हो तो "staging"
: "${DB_HOST:?DB_HOST must be set}"   # unset हो तो error के साथ exit
echo "${#env}"            # string की लंबाई
```

## Arithmetic

```bash
a=10; b=3
echo $(( a + b ))     # 13
echo $(( a / b ))     # 3   (सिर्फ़ integer)
echo $(( a % b ))     # 1
(( a++ )); echo $a    # 11
expr 10 \* 3          # 30  (पुराना तरीका: spaces ज़रूरी, * escape करें)
echo "scale=2; 10/3" | bc   # 3.33 (bc से decimals)
```

## Command substitution

किसी command का output variable में `$(...)` से लें (पुराना backtick तरीका भी चलता है, पर उसे nest करना मुश्किल है):

```bash
today=$(date +%F)
files=$(ls | wc -l)
kernel=`uname -r`
echo "On $today there are $files files, kernel $kernel"
```

## इंटरव्यू प्रश्न

**Q1. `"$@"` और `"$*"` में अंतर?**
`"$@"` हर argument को अलग रखता है (spaces के लिए safe); `"$*"` सबको एक string में जोड़ देता है।

**Q2. `$?` में क्या होता है?**
पिछली command का exit status: success पर `0`, failure पर `1`-`255`।

**Q3. Child script में मेरा variable खाली क्यों है?**
वह export नहीं किया गया। `export VAR=value` लिखें ताकि child processes उसे पाएँ।

**Q4. `x = 5` fail क्यों होता है?**
Spaces की वजह से शेल `x` नाम की command चलाने की कोशिश करता है। `x=5` लिखें।

**Q5. bash में decimal (floating-point) गणित कैसे करें?**
bash सिर्फ़ integers करता है; `bc` या `awk` इस्तेमाल करें, जैसे `echo "3.5*2" | bc`।
