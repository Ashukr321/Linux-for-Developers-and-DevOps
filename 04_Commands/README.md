# Essential Linux Commands

Daily Linux commands for developers: login, help, navigation, file handling, wildcards and quick arithmetic with expr and bc, plus a handy reference table.

## Login and Logout

A Linux session starts with a login (local console, `ssh`, or a terminal in a desktop). After authentication the system starts your login shell (see [shells](../01_Introduction/shells.md)).

```bash
ssh ubuntu@10.0.0.12     # log in to a remote server
whoami                   # which user am I?
who                      # who is logged in right now
exit                     # end the shell (Ctrl+D does the same)
logout                   # end a login shell
```

## Internal vs External Commands

| Type | Where it lives | Examples | Starts a new process? |
| :--- | :--- | :--- | :---: |
| Internal (builtin) | Inside the shell itself | `cd`, `echo`, `pwd`, `export`, `type`, `exit` | No |
| External | A binary on disk, found via `$PATH` | `ls`, `cp`, `grep`, `cat` | Yes (fork + exec) |

`cd` must be a builtin: a child process cannot change its parent's working directory.

```bash
$ type cd
cd is a shell builtin
$ type ls
ls is aliased to `ls --color=auto'
$ type -a echo
echo is a shell builtin
echo is /usr/bin/echo
```

## Getting Help

```bash
man ls            # full manual page (q to quit, /word to search)
man 5 passwd      # section 5 = file formats (section 1 = commands)
ls --help         # short usage for most GNU tools
help cd           # help for bash builtins
apropos copy      # search man pages by keyword (same as man -k)
```

## Navigation and File Commands

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

Paths and inodes are explained in [paths and inodes](../02_Filesystem/paths-and-inodes.md); file access in [permissions](../02_Filesystem/permissions.md).

## Wildcards (Globbing)

The **shell** expands wildcards before the command runs.

| Pattern | Matches | Example |
| :--- | :--- | :--- |
| `*` | Any number of characters | `ls *.log` |
| `?` | Exactly one character | `ls file?.txt` → `file1.txt`, `fileA.txt` |
| `[abc]` | One character from the set | `ls report[123].csv` |
| `[0-9]` | One character from a range | `rm backup-[0-9].tar` |
| `[!x]` | One character not in the set | `ls [!.]*` |

```bash
$ echo *.sh          # see what a glob expands to before using rm
deploy.sh test.sh
```

## Arithmetic: expr and bc

`expr` does integer maths; operators need spaces and `*` must be escaped.

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

`bc` is a calculator with decimals:

```bash
$ echo "10 / 3" | bc
3
$ echo "scale=2; 10 / 3" | bc
3.33
$ echo "scale=2; 512 / 1024 * 100" | bc
50.00
```

## Command Reference Table

| Command | Purpose | Useful flags |
| :--- | :--- | :--- |
| `pwd` | Show current directory | `-P` resolve symlinks |
| `ls` | List directory | `-l -a -h -t -r -R` |
| `cd` | Change directory | `-` previous dir |
| `mkdir` | Make directory | `-p` parents |
| `touch` | Create file / update time | `-t` set time |
| `cat` | Print / join files | `-n` number lines |
| `cp` | Copy | `-r -i -p -v` |
| `mv` | Move / rename | `-i -n -v` |
| `rm` | Remove | `-r -i -f` |
| `type` | Builtin or external? | `-a` all matches |
| `man` | Manual | `-k` keyword search |
| `expr` / `bc` | Arithmetic | `scale=` in bc |

Next: [filters and pipes](filters-and-pipes.md) and [redirection](redirection.md).

## Interview Questions

**Q1. Why is `cd` a builtin and not an external command?**
An external command runs in a child process; changing the child's directory would not affect the parent shell.

**Q2. How do you check whether a command is builtin, an alias or a binary?**
Use `type -a name`; `which` only searches `$PATH`.

**Q3. What does `rm -rf *` do in the wrong directory, and how do you avoid it?**
It deletes everything there without asking. Run `pwd`, preview with `echo *` or `ls`, and prefer `rm -ri` for risky deletes.

**Q4. Who expands `*.txt`: the shell or `ls`?**
The shell. `ls` receives the already expanded list of file names.

**Q5. How do you get decimals from a division in the shell?**
`expr` and `$(( ))` are integer only; use `echo "scale=2; 7/2" | bc`.
