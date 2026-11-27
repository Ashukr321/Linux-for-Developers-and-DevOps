# Variables, Input aur Arithmetic

Shell variables, quoting rules, environment variables aur export, read/echo/printf, positional parameters, set aur shift, arithmetic aur command substitution.

## Variables define aur use karna

```bash
name="Ashu"            # = ke aas-paas space nahi
count=5
echo "$name has $count servers"
echo "${name}_backup"  # braces naam ko aage ke text se alag karte hain
unset count            # variable delete karo
readonly PI=3.14       # baad mein change nahi ho sakta
```

Variables ka koi type nahi hota, sab strings hain. Naam mein letters, digits aur `_` ho sakte hain, par naam digit se start nahi ho sakta. Convention ke hisaab se environment variables `UPPERCASE` mein aur script ke local variables `lowercase` mein hote hain.

## Quoting rules

| Quote | Variables expand? | Example | Output |
| :--- | :---: | :--- | :--- |
| Double `"..."` | Haan | `echo "Home: $HOME"` | `Home: /home/dev` |
| Single `'...'` | Nahi | `echo 'Home: $HOME'` | `Home: $HOME` |
| Backslash `\` | Ek char escape | `echo "Cost: \$5"` | `Cost: $5` |
| Koi nahi | Haan, saath mein word splitting aur globbing | `echo $file` | Spaces par toot jaata hai |

Rule of thumb: variables ko hamesha double quotes mein rakho (`"$file"`), taaki spaces wale file names script na todein.

## Environment variables aur `export`

Plain variable sirf current shell mein rehta hai. `export` use environment variable bana deta hai, jo har child process mein copy hota hai.

```bash
$ APP_ENV=dev
$ bash -c 'echo "child sees: $APP_ENV"'
child sees:
$ export APP_ENV=dev
$ bash -c 'echo "child sees: $APP_ENV"'
child sees: dev
$ PORT=8080 node server.js     # sirf ek command ke liye variable set karo
```

Common variables: `HOME`, `USER`, `PATH`, `PWD`, `SHELL`, `LANG`. Inhe `env` ya `printenv` se dekho; permanent wale `~/.bashrc` ya `~/.profile` mein add karo.

```bash
export PATH="$HOME/bin:$PATH"   # apni scripts ki directory PATH mein add karo
```

## Input aur output: `read`, `echo`, `printf`

```bash
read -p "Enter your name: " user          # prompt dikhakar ek line padho
read -sp "Password: " pass; echo          # -s typing chhupata hai
read -t 10 -p "Continue? (y/n) " ans      # 10 second baad time out
echo "Hello, $user"
echo -e "Line1\nLine2"                     # -e se \n \t jaise escapes chalte hain
printf "%-10s %5d\n" "nginx" 42            # formatted, portable output
```

Alag-alag shells mein `printf` ka behaviour `echo` se zyada predictable hai; formatted output ke liye ise prefer karo.

## Positional parameters aur special variables

`./deploy.sh web 3 prod` ki tarah run karne par:

| Variable | Matlab | Value |
| :--- | :--- | :--- |
| `$0` | Script ka naam | `./deploy.sh` |
| `$1` `$2` ... `${10}` | Arguments | `web`, `3` |
| `$#` | Arguments ki count | `3` |
| `"$@"` | Saare arguments, har ek alag word | `"web" "3" "prod"` |
| `"$*"` | Saare arguments ek string mein | `"web 3 prod"` |
| `$?` | Last command ka exit status | `0` = success |
| `$$` | Current shell ka PID | `48213` |
| `$!` | Last background job ka PID | `48250` |

```bash
#!/usr/bin/env bash
echo "Script: $0, args: $#"
for arg in "$@"; do echo "-> $arg"; done
ls /nope 2>/dev/null; echo "ls exit code: $?"
```

### `set` aur `shift`

```bash
set -- alpha beta gamma   # positional params replace karo
echo "$1 $#"              # alpha 3
shift                     # $1 hatao, baaki sab left shift hote hain
echo "$1 $#"              # beta 2
shift 2                   # do aur hatao
```

`while` loop mein options parse karne ke liye `shift` bahut kaam ka hai ([conditions and loops](conditions-and-loops.md) dekhiye).

## Default values

```bash
env="${1:-staging}"       # $1 khaali ho to "staging"
: "${DB_HOST:?DB_HOST must be set}"   # unset ho to error ke saath exit
echo "${#env}"            # string ki length
```

## Arithmetic

```bash
a=10; b=3
echo $(( a + b ))     # 13
echo $(( a / b ))     # 3   (sirf integer)
echo $(( a % b ))     # 1
(( a++ )); echo $a    # 11
expr 10 \* 3          # 30  (purana style: spaces zaroori, * escape karo)
echo "scale=2; 10/3" | bc   # 3.33 (bc se decimals)
```

## Command substitution

Kisi command ka output variable mein `$(...)` se capture karo (purana backtick form bhi chalta hai, par use nest karna mushkil hai):

```bash
today=$(date +%F)
files=$(ls | wc -l)
kernel=`uname -r`
echo "On $today there are $files files, kernel $kernel"
```

## Interview questions

**Q1. `"$@"` aur `"$*"` mein difference?**
`"$@"` har argument ko alag rakhta hai (spaces ke liye safe); `"$*"` sabko ek string mein jod deta hai.

**Q2. `$?` mein kya hota hai?**
Last command ka exit status: success par `0`, failure par `1`-`255`.

**Q3. Child script mein mera variable khaali kyun hai?**
Woh export nahi kiya gaya. `export VAR=value` likho taaki child processes use inherit karein.

**Q4. `x = 5` fail kyun hota hai?**
Spaces ki wajah se shell `x` naam ki command chalane ki koshish karta hai. `x=5` likho.

**Q5. bash mein floating-point math kaise karein?**
bash sirf integers karta hai; `bc` ya `awk` use karo, jaise `echo "3.5*2" | bc`.
