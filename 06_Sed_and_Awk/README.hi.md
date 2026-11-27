# टेक्स्ट प्रोसेसिंग के लिए रेगुलर एक्सप्रेशन

रेगुलर एक्सप्रेशन ऐसे सर्च पैटर्न हैं जिनसे grep, sed और awk लॉग, कॉन्फ़िग और कमांड आउटपुट में टेक्स्ट ढूँढते, छाँटते और बदलते हैं।

## Regex क्यों ज़रूरी है

लॉग, कॉन्फ़िग फ़ाइलें, CSV एक्सपोर्ट और कमांड आउटपुट सब plain text हैं। Regular expression (regex) टेक्स्ट का एक *पैटर्न* बताता है, जिससे एक ही कमांड हर IP address, हर `ERROR` लाइन या हर commented setting ढूँढ सकती है। `grep`, `sed`, `awk`, `vi` और ज़्यादातर प्रोग्रामिंग भाषाएँ regex समझती हैं।

## BRE बनाम ERE

Unix टूल दो तरह के regex सपोर्ट करते हैं:

| Feature | BRE (Basic) | ERE (Extended) |
| :--- | :--- | :--- |
| डिफ़ॉल्ट रूप से इस्तेमाल | `grep`, `sed` | `grep -E`, `sed -E`, `awk` |
| एक या ज़्यादा | `\+` (GNU) | `+` |
| शून्य या एक | `\?` (GNU) | `?` |
| Alternation | `\\|` (GNU) | `\|` |
| Grouping | `\( \)` | `( )` |
| Repetition count | `\{2,4\}` | `{2,4}` |

ERE में special characters बिना backslash के काम करते हैं, इसलिए पैटर्न पढ़ना आसान होता है। थोड़े भी जटिल काम के लिए `grep -E` और `sed -E` बेहतर हैं।

## बुनियादी हिस्से

### Anchors

| Pattern | अर्थ | उदाहरण |
| :--- | :--- | :--- |
| `^` | लाइन की शुरुआत | `^#` वे लाइनें जो `#` से शुरू हों |
| `$` | लाइन का अंत | `;$` वे लाइनें जो `;` पर ख़त्म हों |
| `^$` | खाली लाइन | `grep -v '^$'` खाली लाइनें हटाता है |
| `\b` | शब्द की सीमा (GNU) | `\berror\b` सिर्फ़ पूरा शब्द मैच करता है |

### Character Classes

| Pattern | किससे मैच करता है |
| :--- | :--- |
| `.` | कोई भी एक character |
| `[abc]` | `a`, `b`, `c` में से एक |
| `[^abc]` | `a`, `b`, `c` को छोड़कर कोई भी character |
| `[0-9]` | एक अंक |
| `[[:digit:]]` | एक अंक (POSIX class, locale safe) |
| `[[:alpha:]]` | एक अक्षर |
| `[[:space:]]` | Space, tab, newline |

### Quantifiers (ERE)

| Pattern | अर्थ |
| :--- | :--- |
| `*` | पिछले item के 0 या ज़्यादा |
| `+` | 1 या ज़्यादा |
| `?` | 0 या 1 |
| `{3}` | ठीक 3 |
| `{2,5}` | 2 से 5 के बीच |

### Groups और Alternation

`( )` items को group करता है ताकि quantifier सब पर लागू हो, और `|` का मतलब "या" है। sed में groups को replacement में `\1`, `\2` के रूप में दोबारा इस्तेमाल किया जा सकता है।

## grep -E के उदाहरण

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

नमूना आउटपुट:

```bash
$ grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' access.log | sort -u
10.0.0.5
192.168.1.20
```

## grep बनाम sed बनाम awk

| Tool | किसके लिए सबसे अच्छा | आम इस्तेमाल |
| :--- | :--- | :--- |
| `grep` | मैच होने वाली लाइनें ढूँढना | `grep -E 'ERROR\|FATAL' app.log` |
| `sed` | लाइन-दर-लाइन टेक्स्ट बदलना (replace, delete, insert) | `sed -i 's/8080/9090/' app.conf` |
| `awk` | Columns, गिनती और reports | `awk '{print $1}' access.log` |

सीधा नियम: grep से **ढूँढो**, sed से **बदलो**, awk से **गिनो**। ये [pipes](../04_Commands/filters-and-pipes.md) में साथ अच्छे से काम करते हैं।

## इस सेक्शन के नोट्स

- [sed: स्ट्रीम एडिटर](sed.md)
- [awk: फ़ील्ड, पैटर्न और रिपोर्ट](awk.md)

## आम गलतियाँ

**Q: `grep 'a+'` उम्मीद के मुताबिक `aaa` से मैच क्यों नहीं करता?**
A: BRE में `+` एक literal plus है। `grep -E 'a+'` (या GNU BRE में `a\+`) इस्तेमाल करें।

**Q: `grep '.'` हर लाइन से मैच क्यों करता है?**
A: `.` का मतलब कोई भी character है। literal dot के लिए `\.` लिखें, जैसे `grep '\.conf$'`।

**Q: पैटर्न को single quotes में क्यों रखें?**
A: Quotes के बिना shell `*`, `$` और `?` को grep तक पहुँचने से पहले ही expand कर देता है।

**Q: क्या `[0-9]{1,3}` एक सख़्त IP validator है?**
A: नहीं, यह `999` से भी मैच करता है। लॉग से IP निकालने के लिए ठीक है, input validate करने के लिए नहीं।
