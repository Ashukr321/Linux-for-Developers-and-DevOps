# शेल स्क्रिप्टिंग की बुनियाद

जानिए शेल स्क्रिप्ट क्या है, shebang और execute permission कैसे काम करते हैं, स्क्रिप्ट चलाने के तरीके, और हर स्क्रिप्ट में set -euo pipefail क्यों ज़रूरी है।

![Unix shell scripting overview](../unix-shell-scripting%20%281%29.png)

## शेल स्क्रिप्ट क्या है?

शेल स्क्रिप्ट एक साधारण टेक्स्ट फ़ाइल है जिसमें commands लिखी होती हैं, और शेल उन्हें एक के बाद एक चलाता है। जो कुछ आप prompt पर टाइप कर सकते हैं, वह सब स्क्रिप्ट में जा सकता है: `cd`, `cp`, pipes, loops, conditions और functions। स्क्रिप्ट बार-बार होने वाले काम (backup, deployment, log cleanup, health check) को एक दोहराने योग्य command में बदल देती है।

DevOps में शेल स्क्रिप्ट हर जगह मिलती हैं: Docker `ENTRYPOINT` स्क्रिप्ट, CI/CD pipeline steps, cron jobs और server bootstrap (`user_data`) स्क्रिप्ट। `sh`, `bash`, `ksh` और `zsh` का अंतर [shells](../01_Introduction/shells.md) में देखें।

## Shebang लाइन

स्क्रिप्ट की पहली लाइन kernel को बताती है कि कौन-सा interpreter इसे चलाएगा:

```bash
#!/bin/bash              # हमेशा इस path वाला bash इस्तेमाल करें
#!/usr/bin/env bash      # $PATH में bash ढूँढें (ज़्यादा portable: macOS, NixOS, containers)
#!/bin/sh                # सिर्फ़ POSIX sh (Debian/Ubuntu पर dash, bash features नहीं)
```

Shebang के बिना फ़ाइल आपके मौजूदा शेल से चलती है, जिसका व्यवहार अलग हो सकता है।

## स्क्रिप्ट को executable बनाना

नई फ़ाइल default रूप से executable नहीं होती। `chmod` से execute bit जोड़ें ([permissions](../02_Filesystem/permissions.md) देखें):

```bash
$ ls -l hello.sh
-rw-r--r-- 1 dev dev 45 Nov 27 10:00 hello.sh
$ chmod +x hello.sh
$ ls -l hello.sh
-rwxr-xr-x 1 dev dev 45 Nov 27 10:00 hello.sh
```

## स्क्रिप्ट चलाने के तरीके

| Command | नया process? | `+x` चाहिए? | Shebang इस्तेमाल? | आम उपयोग |
| :--- | :---: | :---: | :---: | :--- |
| `./script.sh` | हाँ | हाँ | हाँ | स्क्रिप्ट चलाने का सामान्य तरीका |
| `bash script.sh` | हाँ | नहीं | नहीं (bash ज़बरदस्ती) | जल्दी चलाना, `bash -x` से debugging |
| `source script.sh` या `. script.sh` | नहीं (मौजूदा शेल) | नहीं | नहीं | variables/functions लोड करना, जैसे `source ~/.bashrc` |

मुख्य अंतर: `source` फ़ाइल को आपके मौजूदा शेल के अंदर चलाता है, इसलिए उसके अंदर के `cd` और `export` आपके session को बदल देते हैं। `./script.sh` एक child process में चलता है, और exit होते ही उसके बदलाव ख़त्म हो जाते हैं।

```bash
$ cat setenv.sh
export APP_ENV=production
$ ./setenv.sh && echo "$APP_ENV"     # खाली लाइन छपती है
$ source setenv.sh && echo "$APP_ENV"
production
```

`./` क्यों? सुरक्षा के लिए मौजूदा directory `$PATH` में नहीं होती, इसलिए path साफ़-साफ़ देना पड़ता है।

## Strict mode: `set -euo pipefail`

Default रूप से bash किसी command के fail होने पर भी आगे चलता रहता है। Production में यह ख़तरनाक है: fail हुआ `cd` और उसके बाद `rm -rf *` ग़लत directory मिटा सकता है। इसे हर स्क्रिप्ट के ऊपर लिखें:

| Option | असर |
| :--- | :--- |
| `set -e` | कोई command non-zero status लौटाए तो तुरंत exit |
| `set -u` | unset variable का इस्तेमाल error माना जाए |
| `set -o pipefail` | pipeline में कोई भी command fail हो तो पूरी pipeline fail, सिर्फ़ आख़िरी नहीं |
| `set -x` | (Debug) हर command चलाने से पहले print करें |

```bash
$ bash -c 'false | true; echo "status=$?"'
status=0
$ bash -c 'set -o pipefail; false | true; echo "status=$?"'
status=1
```

## एक पूरी छोटी स्क्रिप्ट

`backup.sh` किसी directory को तारीख़ वाले नाम के साथ `/tmp/backups` में archive करती है:

```bash
#!/usr/bin/env bash
# backup.sh - timestamp के साथ directory का archive
set -euo pipefail

SRC="${1:-$HOME/projects}"          # पहला argument, या default
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

इसे cron से हर रात चलाएँ ([scheduling](../03_Processes/scheduling.md) देखें): `0 2 * * * /home/dev/backup.sh`।

## आगे क्या

- [vi editor](vi-editor.md) — किसी भी server पर स्क्रिप्ट लिखें और edit करें
- [Variables](variables.md) — variables, arguments और arithmetic
- [Conditions and loops](conditions-and-loops.md) — `if`, `case`, `for`, `while` और functions

## इंटरव्यू प्रश्न

**Q1. `./script.sh` और `source script.sh` में क्या अंतर है?**
`./script.sh` एक नए child शेल में चलता है; `source` मौजूदा शेल में चलता है, इसलिए variable, `cd` और `export` के बदलाव बने रहते हैं।

**Q2. Shebang क्या करता है?**
जब फ़ाइल सीधे चलाई जाती है, तो यह kernel को बताता है कि कौन-सा interpreter इस्तेमाल करना है, जैसे `#!/bin/bash`।

**Q3. `./deploy.sh` चलाने पर "Permission denied" आता है। क्यों?**
फ़ाइल में execute bit नहीं है। `chmod +x deploy.sh` से ठीक करें, या `bash deploy.sh` से चलाएँ।

**Q4. `set -euo pipefail` क्यों इस्तेमाल करें?**
इससे स्क्रिप्ट errors, unset variables और pipeline के अंदर की failures पर रुक जाती है, चुपचाप आगे नहीं बढ़ती।

**Q5. स्क्रिप्ट को debug कैसे करें?**
`bash -x script.sh` चलाएँ या `set -x` जोड़ें, जिससे हर command अपने expanded arguments के साथ print होती है।
