# nano: Complete Guide

nano seekho, Linux ka aasaan terminal editor: files kholna, har key shortcut, search aur replace, nanorc settings aur servers par real edits.

## nano kyon?

`nano` ek chhota, bina modes wala editor hai: aap type karte ho aur text dikhta hai, bilkul Notepad ki tarah. Sabse kaam ke shortcuts hamesha screen ke neeche dikhte hain. Ye Ubuntu aur Debian par default editor hai, isliye wahan `crontab -e` aur `visudo` isi ko kholte hain. Poori picture ke liye [Linux par text editors](README.md) dekho, aur modes wale option ke liye [vim](vim.md).

## Files kholna

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

## Shortcut notation ko padhna

| Notation | Matlab | Example |
| :--- | :--- | :--- |
| `^` | `Ctrl` dabakar rakho | `^O` = `Ctrl+O` |
| `M-` | `Alt` (Meta) dabakar rakho, ya `Esc` dabake phir key | `M-U` = `Alt+U` |
| `^G` | Poori built-in help kholta hai | hamesha kaam karta hai |

Letters case-sensitive nahi hain: `^o` aur `^O` same hain.

## Shortcut reference

### File

| Keys | Kaam |
| :--- | :--- |
| `^O` | Write Out (save); file name confirm karne ke liye Enter dabao |
| `^X` | Exit; poochta hai "Save modified buffer?" Y / N / `^C` cancel |
| `^R` | Read File: cursor par doosri file daalo |
| `^G` | Help |

### Navigation

| Keys | Kaam |
| :--- | :--- |
| `^A` / `^E` | Line ki shuruaat / end |
| `^Y` / `^V` | Page up / page down |
| `^_` (ya `M-G`) | Line (aur column) number par jao |
| `M-\` / `M-/` | File ki pehli line / aakhri line |
| `^C` | Cursor ki position (line, column) dikhao |
| `^F` / `^B` | Ek character aage / peeche (arrow keys bhi chalti hain) |

### Editing

| Keys | Kaam |
| :--- | :--- |
| `^K` | Current line (ya marked text) cut karo |
| `^U` | Paste (uncut) |
| `M-6` | Current line (ya marked text) copy karo |
| `M-A` (ya `^6`) | Mark set karo: arrow keys se text select karna shuru |
| `^J` | Current paragraph ko justify (dobara wrap) karo |
| `M-U` / `M-E` | Undo / redo |
| `M-}` / `M-{` | Line ya selection ko indent / unindent karo |
| `M-3` | Line ya selection ko comment / uncomment karo |

Lagataar kai baar `^K` dabane se kai lines ek hi clipboard mein cut hoti hain; `^U` un sabko paste karta hai.

### Search aur replace

| Keys | Kaam |
| :--- | :--- |
| `^W` | Where Is: aage ki taraf search |
| `M-W` / `M-Q` | Agla match / pichhla match |
| `^\` (ya `M-R`) | Replace: search text, phir replacement, phir `Y` / `N` / `A` (all) |
| `^W` prompt ke andar `M-C` / `M-R` | Case-sensitive / regular expression on-off |

### Spell check aur multiple buffers

| Keys | Kaam |
| :--- | :--- |
| `F12` (ya nano 4 aur purane mein `^T`) | Spell check (`spell` ya `hunspell` install hona chahiye) |
| `^R` phir `M-F` | File ko insert karne ke bajaye naye buffer mein kholo |
| `M-<` / `M->` (ya `M-,` / `M-.`) | Pichhle / agle buffer par jao |

## ~/.nanorc se nano configure karna

Settings `~/.nanorc` (ek user ke liye) ya `/etc/nanorc` (poore system ke liye) mein jaati hain.

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

Apna version `nano --version` se dekho; kuch options (jaise `M-3` comments) ke liye nano 2.6 ya naya chahiye.

## Real-use examples

### /etc/hosts mein host entry jodna

```bash
sudo nano /etc/hosts
# go to the last line with M-/ and add:
# 10.0.1.20   db.internal
# save with ^O Enter, exit with ^X
ping -c1 db.internal
```

### nginx config badalna aur test karna

```bash
sudo nano +1 -l /etc/nginx/sites-available/default
# ^W "server_name", change it, ^O Enter, ^X
sudo nginx -t && sudo systemctl reload nginx
```

Poora nginx setup [install nginx](../08_Projects_and_Use_Cases/install-nginx.md) mein hai.

### Application ki .env file edit karna

```bash
nano -B .env              # backup kept as .env~
# ^\ to replace DB_HOST=localhost with DB_HOST=db.internal, press A for all
```

### nano se apna crontab edit karna

```bash
EDITOR=nano crontab -e
# add:  */5 * * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
# ^O Enter, ^X  -> "crontab: installing new crontab"
```

Cron syntax ke liye [scheduling](../03_Processes/scheduling.md) dekho. Aur end-to-end kaam [real-world editing](real-world-editing.md) mein hain.

## Common mistakes

- **`sudo` bhool jaana.** Aap `/etc/hosts` edit karte ho, `^O` dabate ho, aur `[ Error writing /etc/hosts: Permission denied ]` milta hai. `^O` se copy `/tmp/hosts` mein save karo, exit karo, phir `sudo cp /tmp/hosts /etc/hosts`. Agli baar `sudo nano` ya `sudoedit` use karo.
- **Windows line endings.** Windows par bani file mein `[ Converted from DOS format ]` dikhta hai aur scripts `bad interpreter: /bin/bash^M` se fail hoti hain. `^O` prompt mein `M-D` dabake DOS format band karo, ya `dos2unix file` chalao.
- **YAML mein tabs.** YAML mein tab se indentation allowed nahi hai. Kubernetes ya Docker Compose files edit karne se pehle `~/.nanorc` mein `set tabstospaces` jodo.
- **nano ka lambi lines ko wrap karna.** Purane nano versions lambi lines tod dete hain aur configs kharab hote hain. `nano -w` (`--nowrap`) se kholo ya `set nowrap` jodo.
- **`^S` ya `^Z` dabana.** `^Z` nano ko suspend karta hai (`fg` se wapas aao); `^S` sirf naye versions mein save karta hai aur purane terminals ko freeze kar sakta hai (`^Q` se unfreeze).

## Interview Questions

**Q1. nano mein save aur exit kaise karein?**
Save ke liye `^O` phir Enter, exit ke liye `^X`. Ya seedha `^X`, phir `Y` aur Enter.

**Q2. nano mein file ki line 120 par kaise jaayein?**
`nano +120 file` se kholo, ya nano ke andar `^_` dabake `120` type karo.

**Q3. nano mein saari jagah search aur replace kaise karein?**
`^\` dabao, search text type karo, Enter, replacement type karo, Enter, phir sab replace karne ke liye `A`.

**Q4. nano ki permanent settings kahan rakhte hain?**
Ek user ke liye `~/.nanorc` mein ya saare users ke liye `/etc/nanorc` mein, jaise `set linenumbers` aur `set tabstospaces`.

**Q5. nano aane ke baad bhi vi kyon seekhna chahiye?**
Kai minimal images (Alpine, RHEL minimal, slim containers) mein nano install nahi hota, jabki `vi` lagbhag hamesha maujood hota hai.
