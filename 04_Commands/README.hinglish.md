# Zaroori Linux Commands

Developers ke liye roz ki Linux commands: login, help, navigation, file handling, wildcards aur expr va bc se calculation, saath mein ek reference table.

## Login aur Logout

Linux session login se shuru hota hai (local console, `ssh`, ya desktop ka terminal). Authentication ke baad system aapka login shell start karta hai ([shells](../01_Introduction/shells.md) dekhein).

```bash
ssh ubuntu@10.0.0.12     # log in to a remote server
whoami                   # which user am I?
who                      # who is logged in right now
exit                     # end the shell (Ctrl+D does the same)
logout                   # end a login shell
```

## Internal vs External Commands

| Type | Kahan rehti hai | Examples | Naya process banta hai? |
| :--- | :--- | :--- | :---: |
| Internal (builtin) | Shell ke andar hi | `cd`, `echo`, `pwd`, `export`, `type`, `exit` | Nahi |
| External | Disk par binary, `$PATH` se milti hai | `ls`, `cp`, `grep`, `cat` | Haan (fork + exec) |

`cd` ka builtin hona zaroori hai: child process apne parent ki working directory change nahi kar sakta.

```bash
$ type cd
cd is a shell builtin
$ type ls
ls is aliased to `ls --color=auto'
$ type -a echo
echo is a shell builtin
echo is /usr/bin/echo
```

## Help Kaise Lein

```bash
man ls            # full manual page (q to quit, /word to search)
man 5 passwd      # section 5 = file formats (section 1 = commands)
ls --help         # short usage for most GNU tools
help cd           # help for bash builtins
apropos copy      # search man pages by keyword (same as man -k)
```

## Navigation aur File Commands

```bash
pwd                         # print working directory
ls -la                      # long list, include hidden files
ls -lh /var/log             # human-readable sizes
cd /etc                     # absolute path
cd ..                       # parent directory
cd ~   or   cd              # home directory
cd -                        # previous directory
mkdir projects              # create a directory
mkdir -p app/src/utils      # create parents as needed
touch notes.txt             # create empty file or update timestamp
cat notes.txt               # print file
cp a.txt b.txt              # copy file
cp -r src/ backup/          # copy directory recursively
mv old.txt new.txt          # rename
mv *.log logs/              # move files
rm file.txt                 # delete file (no recycle bin!)
rm -i *.tmp                 # ask before each delete
rm -r build/                # delete directory tree
```

Paths aur inodes [paths and inodes](../02_Filesystem/paths-and-inodes.md) mein samjhaye gaye hain; file access [permissions](../02_Filesystem/permissions.md) mein.

## Wildcards (Globbing)

Wildcards ko command chalne se pehle **shell** expand karta hai.

| Pattern | Kisse match karta hai | Example |
| :--- | :--- | :--- |
| `*` | Kitne bhi characters | `ls *.log` |
| `?` | Bilkul ek character | `ls file?.txt` → `file1.txt`, `fileA.txt` |
| `[abc]` | Set mein se ek character | `ls report[123].csv` |
| `[0-9]` | Range mein se ek character | `rm backup-[0-9].tar` |
| `[!x]` | Set ke bahar ka ek character | `ls [!.]*` |

```bash
$ echo *.sh          # see what a glob expands to before using rm
deploy.sh test.sh
```

## Calculation: expr aur bc

`expr` sirf integer maths karta hai; operators ke around space chahiye aur `*` ko escape karna padta hai.

```bash
$ expr 10 + 3
13
$ expr 10 \* 3
30
$ expr 10 / 3
3
$ echo $((10 % 3))           # modern bash arithmetic
1
```

`bc` decimals wala calculator hai:

```bash
$ echo "10 / 3" | bc
3
$ echo "scale=2; 10 / 3" | bc
3.33
$ echo "scale=2; 512 / 1024 * 100" | bc
50.00
```

## Command Reference Table

| Command | Kaam | Useful flags |
| :--- | :--- | :--- |
| `pwd` | Current directory dikhaye | `-P` symlinks resolve kare |
| `ls` | Directory ki list | `-l -a -h -t -r -R` |
| `cd` | Directory badle | `-` pichhli dir |
| `mkdir` | Directory banaye | `-p` parents |
| `touch` | File banaye / time update kare | `-t` time set kare |
| `cat` | File dikhaye / jode | `-n` line numbers |
| `cp` | Copy | `-r -i -p -v` |
| `mv` | Move / rename | `-i -n -v` |
| `rm` | Delete | `-r -i -f` |
| `type` | Builtin ya external? | `-a` saare matches |
| `man` | Manual | `-k` keyword search |
| `expr` / `bc` | Calculation | bc mein `scale=` |

Aage padhein: [filters and pipes](filters-and-pipes.md) aur [redirection](redirection.md).

## Interview Questions

**Q1. `cd` external command kyun nahi, builtin kyun hai?**
External command child process mein chalti hai; child ki directory badalne se parent shell par koi asar nahi padta.

**Q2. Kaise pata karein ki command builtin hai, alias hai ya binary?**
`type -a name` chalayein; `which` sirf `$PATH` mein dhoondhta hai.

**Q3. Galat directory mein `rm -rf *` chalane se kya hoga, aur isse kaise bachein?**
Wahan ka sab kuch bina puchhe delete ho jayega. Pehle `pwd` chalayein, `echo *` ya `ls` se preview karein, aur risky delete ke liye `rm -ri` use karein.

**Q4. `*.txt` ko kaun expand karta hai: shell ya `ls`?**
Shell. `ls` ko pehle se expand hui file names ki list milti hai.

**Q5. Shell mein division ka decimal answer kaise paayein?**
`expr` aur `$(( ))` sirf integer dete hain; `echo "scale=2; 7/2" | bc` use karein.
