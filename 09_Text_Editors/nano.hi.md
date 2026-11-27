# nano: पूरी गाइड

nano सीखें, Linux का आसान terminal editor: files खोलना, हर key shortcut, search और replace, nanorc settings और servers पर असली edits।

## nano क्यों?

`nano` एक छोटा, बिना modes वाला editor है: आप टाइप करते हैं और text दिखता है, बिल्कुल Notepad की तरह। सबसे काम के shortcuts हमेशा screen के नीचे दिखते हैं। यह Ubuntu और Debian पर default editor है, इसलिए वहाँ `crontab -e` और `visudo` इसे ही खोलते हैं। पूरी तस्वीर के लिए [Linux पर text editors](README.md) देखें, और modes वाले विकल्प के लिए [vim](vim.md)।

## Files खोलना

```bash
nano notes.txt                 # open or create a file
nano +25 app.conf              # open with cursor on line 25
nano +25,8 app.conf            # line 25, column 8
nano -l app.conf               # show line numbers (--linenumbers)
nano -B app.conf               # keep a backup as app.conf~ on save (--backup)
nano -v /var/log/syslog        # view only, no changes allowed (--view)
sudo nano /etc/hosts           # edit a root-owned file
sudoedit /etc/hosts            # safer: edits a copy as your user, saves as root
nano a.conf b.conf             # open two files as separate buffers
```

## Shortcut notation को पढ़ना

| Notation | मतलब | उदाहरण |
| :--- | :--- | :--- |
| `^` | `Ctrl` दबाकर रखें | `^O` = `Ctrl+O` |
| `M-` | `Alt` (Meta) दबाकर रखें, या `Esc` दबाकर फिर key | `M-U` = `Alt+U` |
| `^G` | पूरी built-in help खोलता है | हमेशा काम करता है |

Letters case-sensitive नहीं हैं: `^o` और `^O` एक ही हैं।

## Shortcut reference

### File

| Keys | काम |
| :--- | :--- |
| `^O` | Write Out (save); file name पक्का करने के लिए Enter दबाएँ |
| `^X` | Exit; पूछता है "Save modified buffer?" Y / N / `^C` cancel |
| `^R` | Read File: cursor पर दूसरी file डालें |
| `^G` | Help |

### Navigation

| Keys | काम |
| :--- | :--- |
| `^A` / `^E` | Line की शुरुआत / अंत |
| `^Y` / `^V` | Page up / page down |
| `^_` (या `M-G`) | Line (और column) number पर जाएँ |
| `M-\` / `M-/` | File की पहली line / आख़िरी line |
| `^C` | Cursor की position (line, column) दिखाएँ |
| `^F` / `^B` | एक character आगे / पीछे (arrow keys भी चलती हैं) |

### Editing

| Keys | काम |
| :--- | :--- |
| `^K` | मौजूदा line (या marked text) cut करें |
| `^U` | Paste (uncut) |
| `M-6` | मौजूदा line (या marked text) copy करें |
| `M-A` (या `^6`) | Mark सेट करें: arrow keys से text select करना शुरू |
| `^J` | मौजूदा paragraph को justify (दोबारा wrap) करें |
| `M-U` / `M-E` | Undo / redo |
| `M-}` / `M-{` | Line या selection को indent / unindent करें |
| `M-3` | Line या selection को comment / uncomment करें |

लगातार कई बार `^K` दबाने से कई lines एक ही clipboard में cut होती हैं; `^U` उन सबको paste करता है।

### Search और replace

| Keys | काम |
| :--- | :--- |
| `^W` | Where Is: आगे की ओर search |
| `M-W` / `M-Q` | अगला match / पिछला match |
| `^\` (या `M-R`) | Replace: search text, फिर replacement, फिर `Y` / `N` / `A` (all) |
| `^W` prompt के अंदर `M-C` / `M-R` | Case-sensitive / regular expression on-off |

### Spell check और कई buffers

| Keys | काम |
| :--- | :--- |
| `F12` (या nano 4 और पुराने में `^T`) | Spell check (`spell` या `hunspell` इंस्टॉल होना चाहिए) |
| `^R` फिर `M-F` | File को insert करने के बजाय नए buffer में खोलें |
| `M-<` / `M->` (या `M-,` / `M-.`) | पिछले / अगले buffer पर जाएँ |

## ~/.nanorc से nano configure करना

Settings `~/.nanorc` (एक user के लिए) या `/etc/nanorc` (पूरे system के लिए) में जाती हैं।

```bash
# ~/.nanorc
set linenumbers          # show line numbers
set tabsize 4            # width of a tab
set tabstospaces         # insert spaces when Tab is pressed
set autoindent           # keep indentation of the previous line
set mouse                # click to move cursor, scroll with wheel
set softwrap             # wrap long lines on screen (file unchanged)
set constantshow         # always show line/column in status bar
include "/usr/share/nano/*.nanorc"   # syntax highlighting for many languages
```

अपना version `nano --version` से देखें; कुछ options (जैसे `M-3` comments) के लिए nano 2.6 या नया चाहिए।

## असली इस्तेमाल के उदाहरण

### /etc/hosts में host entry जोड़ना

```bash
sudo nano /etc/hosts
# go to the last line with M-/ and add:
# 10.0.1.20   db.internal
# save with ^O Enter, exit with ^X
ping -c1 db.internal
```

### nginx config बदलना और test करना

```bash
sudo nano +1 -l /etc/nginx/sites-available/default
# ^W "server_name", change it, ^O Enter, ^X
sudo nginx -t && sudo systemctl reload nginx
```

पूरा nginx setup [install nginx](../08_Projects_and_Use_Cases/install-nginx.md) में है।

### Application की .env file edit करना

```bash
nano -B .env              # backup kept as .env~
# ^\ to replace DB_HOST=localhost with DB_HOST=db.internal, press A for all
```

### nano से अपना crontab edit करना

```bash
EDITOR=nano crontab -e
# add:  */5 * * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
# ^O Enter, ^X  -> "crontab: installing new crontab"
```

Cron syntax के लिए [scheduling](../03_Processes/scheduling.md) देखें। और पूरे काम [real-world editing](real-world-editing.md) में हैं।

## आम गलतियाँ

- **`sudo` भूल जाना।** आप `/etc/hosts` edit करते हैं, `^O` दबाते हैं, और `[ Error writing /etc/hosts: Permission denied ]` मिलता है। `^O` से copy `/tmp/hosts` में save करें, exit करें, फिर `sudo cp /tmp/hosts /etc/hosts`। अगली बार `sudo nano` या `sudoedit` इस्तेमाल करें।
- **Windows line endings।** Windows पर बनी file में `[ Converted from DOS format ]` दिखता है और scripts `bad interpreter: /bin/bash^M` से fail होती हैं। `^O` prompt में `M-D` दबाकर DOS format बंद करें, या `dos2unix file` चलाएँ।
- **YAML में tabs।** YAML में tab से indentation मना है। Kubernetes या Docker Compose files edit करने से पहले `~/.nanorc` में `set tabstospaces` जोड़ें।
- **nano का लंबी lines को wrap करना।** पुराने nano versions लंबी lines को तोड़ देते हैं और configs खराब होते हैं। `nano -w` (`--nowrap`) से खोलें या `set nowrap` जोड़ें।
- **`^S` या `^Z` दबाना।** `^Z` nano को suspend करता है (`fg` से वापस आएँ); `^S` सिर्फ़ नए versions में save करता है और पुराने terminals को freeze कर सकता है (`^Q` से unfreeze)।

## इंटरव्यू प्रश्न

**Q1. nano में save और exit कैसे करें?**
Save के लिए `^O` फिर Enter, exit के लिए `^X`। या सीधे `^X`, फिर `Y` और Enter।

**Q2. nano में file की line 120 पर कैसे जाएँ?**
`nano +120 file` से खोलें, या nano के अंदर `^_` दबाकर `120` टाइप करें।

**Q3. nano में सभी जगह search और replace कैसे करें?**
`^\` दबाएँ, search text टाइप करें, Enter, replacement टाइप करें, Enter, फिर सब replace करने के लिए `A`।

**Q4. nano की स्थायी settings कहाँ रखते हैं?**
एक user के लिए `~/.nanorc` में या सभी users के लिए `/etc/nanorc` में, जैसे `set linenumbers` और `set tabstospaces`।

**Q5. nano आने के बाद भी vi क्यों सीखना चाहिए?**
कई minimal images (Alpine, RHEL minimal, slim containers) में nano इंस्टॉल नहीं होता, जबकि `vi` लगभग हमेशा मौजूद होता है।
