# nano: Complete Guide

Learn nano, the beginner-friendly Linux terminal editor: opening files, every key shortcut, search and replace, nanorc settings and real server edits.

## Why nano?

`nano` is a small, modeless editor: you type and text appears, like Notepad. The most useful shortcuts are always listed at the bottom of the screen. It is the default editor on Ubuntu and Debian, so `crontab -e` and `visudo` open it there. For the bigger picture see [text editors on Linux](README.md), and for the modal alternative see [vim](vim.md).

## Opening files

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

## Reading the shortcut notation

| Notation | Means | Example |
| :--- | :--- | :--- |
| `^` | Hold `Ctrl` | `^O` = `Ctrl+O` |
| `M-` | Hold `Alt` (Meta), or press `Esc` then the key | `M-U` = `Alt+U` |
| `^G` | Opens the full built-in help | always works |

Letters are not case-sensitive: `^o` and `^O` are the same.

## Shortcut reference

### File

| Keys | Action |
| :--- | :--- |
| `^O` | Write Out (save); press Enter to confirm the file name |
| `^X` | Exit; asks "Save modified buffer?" Y / N / `^C` cancel |
| `^R` | Read File: insert another file at the cursor |
| `^G` | Help |

### Navigation

| Keys | Action |
| :--- | :--- |
| `^A` / `^E` | Start / end of line |
| `^Y` / `^V` | Page up / page down |
| `^_` (or `M-G`) | Go to line (and column) number |
| `M-\` / `M-/` | First line / last line of the file |
| `^C` | Show cursor position (line, column) |
| `^F` / `^B` | Forward / back one character (arrow keys also work) |

### Editing

| Keys | Action |
| :--- | :--- |
| `^K` | Cut current line (or marked text) |
| `^U` | Paste (uncut) |
| `M-6` | Copy current line (or marked text) |
| `M-A` (or `^6`) | Set mark: start selecting text with arrow keys |
| `^J` | Justify (re-wrap) the current paragraph |
| `M-U` / `M-E` | Undo / redo |
| `M-}` / `M-{` | Indent / unindent line or selection |
| `M-3` | Comment / uncomment line or selection |

Pressing `^K` several times in a row cuts several lines into one clipboard; `^U` pastes them all.

### Search and replace

| Keys | Action |
| :--- | :--- |
| `^W` | Where Is: search forward |
| `M-W` / `M-Q` | Next match / previous match |
| `^\` (or `M-R`) | Replace: enter search, then replacement, then `Y` / `N` / `A` (all) |
| `M-C` / `M-R` inside the `^W` prompt | Toggle case-sensitive / regular expression |

### Spell check and multiple buffers

| Keys | Action |
| :--- | :--- |
| `F12` (or `^T` in nano 4 and older) | Spell check (needs `spell` or `hunspell` installed) |
| `^R` then `M-F` | Open a file into a new buffer instead of inserting it |
| `M-<` / `M->` (or `M-,` / `M-.`) | Switch to previous / next buffer |

## Configuring nano with ~/.nanorc

Settings go in `~/.nanorc` (per user) or `/etc/nanorc` (system-wide).

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

Check your version with `nano --version`; a few options (like `M-3` comments) need nano 2.6 or newer.

## Real-use examples

### Add a host entry to /etc/hosts

```bash
sudo nano /etc/hosts
# go to the last line with M-/ and add:
# 10.0.1.20   db.internal
# save with ^O Enter, exit with ^X
ping -c1 db.internal
```

### Change an nginx config and test it

```bash
sudo nano +1 -l /etc/nginx/sites-available/default
# ^W "server_name", change it, ^O Enter, ^X
sudo nginx -t && sudo systemctl reload nginx
```

Full nginx setup is in [install nginx](../08_Projects_and_Use_Cases/install-nginx.md).

### Edit an application .env file

```bash
nano -B .env              # backup kept as .env~
# ^\ to replace DB_HOST=localhost with DB_HOST=db.internal, press A for all
```

### Edit your crontab with nano

```bash
EDITOR=nano crontab -e
# add:  */5 * * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
# ^O Enter, ^X  -> "crontab: installing new crontab"
```

See [scheduling](../03_Processes/scheduling.md) for cron syntax. More end-to-end tasks are in [real-world editing](real-world-editing.md).

## Common mistakes

- **Forgetting `sudo`.** You edit `/etc/hosts`, press `^O`, and get `[ Error writing /etc/hosts: Permission denied ]`. Save a copy with `^O` to `/tmp/hosts`, exit, then `sudo cp /tmp/hosts /etc/hosts`. Next time use `sudo nano` or `sudoedit`.
- **Windows line endings.** A file created on Windows shows `[ Converted from DOS format ]` and scripts fail with `bad interpreter: /bin/bash^M`. In the `^O` prompt press `M-D` to toggle DOS format off, or run `dos2unix file`.
- **Tabs in YAML.** YAML forbids tab indentation. Add `set tabstospaces` to `~/.nanorc` before editing Kubernetes or Docker Compose files.
- **Long lines wrapped by nano.** Old nano versions hard-wrap long lines and break configs. Start with `nano -w` (`--nowrap`) or add `set nowrap`.
- **Pressing `^S` or `^Z`.** `^Z` suspends nano (return with `fg`); `^S` saves only in newer versions and may freeze old terminals (unfreeze with `^Q`).

## Interview Questions

**Q1. How do you save and exit in nano?**
`^O` then Enter to save, `^X` to exit. Or just `^X`, then `Y` and Enter.

**Q2. How do you jump to line 120 of a file in nano?**
Open it with `nano +120 file`, or press `^_` inside nano and type `120`.

**Q3. How do you search and replace all occurrences in nano?**
Press `^\`, type the search text, Enter, type the replacement, Enter, then `A` to replace all.

**Q4. Where do you put permanent nano settings?**
In `~/.nanorc` for one user or `/etc/nanorc` for all users, e.g. `set linenumbers` and `set tabstospaces`.

**Q5. Why might you still need vi if you know nano?**
nano is not installed on many minimal images (Alpine, RHEL minimal, slim containers), while `vi` is almost always present.
