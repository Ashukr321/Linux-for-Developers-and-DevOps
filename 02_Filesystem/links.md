# Hard Links and Symbolic Links

How hard links share an inode, how symbolic links point to a path, using ln and ln -s, the key differences, and finding and fixing broken links.

## Two Ways to Give a File Another Name

Recall from [paths and inodes](paths-and-inodes.md) that a directory entry maps a **name** to an **inode number**. Links build on that:

- **Hard link**: a second directory entry pointing to the **same inode**. Both names are equal; neither is the "original".
- **Symbolic (soft) link**: a small separate file, with its own inode, whose content is a **path** to another file. Like a shortcut.

```text
hard link:    report.txt ----\
                              >---- inode 1048700 ---- data blocks
              backup.txt ----/

symlink:      latest -> report.txt     (inode 1048755 holds the text "report.txt")
```

## Hard Links with ln

```bash
$ echo "Q4 numbers" > report.txt
$ ln report.txt backup.txt
$ ls -li report.txt backup.txt
1048700 -rw-r--r-- 2 ashu ashu 11 Nov 27 12:00 backup.txt
1048700 -rw-r--r-- 2 ashu ashu 11 Nov 27 12:00 report.txt
```

Same inode number, and the link count is now **2**. Editing one name changes the content seen by both.

```bash
$ rm report.txt
$ cat backup.txt          # still works
Q4 numbers
$ ls -li backup.txt       # link count back to 1
1048700 -rw-r--r-- 1 ashu ashu 11 Nov 27 12:00 backup.txt
```

The data is freed only when the link count reaches 0 and no process still has the file open.

## Symbolic Links with ln -s

```bash
$ ln -s report.txt latest
$ ls -li latest
1048755 lrwxrwxrwx 1 ashu ashu 10 Nov 27 12:05 latest -> report.txt
$ readlink latest
report.txt
$ readlink -f latest      # full resolved path
/home/ashu/report.txt
```

Notice the `l` type, its own inode, and size 10 (the length of the text `report.txt`). Symlink permissions always show `rwxrwxrwx`; access is checked on the target.

Typical DevOps uses:

```bash
# enable an nginx site
sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/
# zero-downtime deploys: switch "current" to a new release
ln -sfn /srv/app/releases/2026-11-27 /srv/app/current
# point a tool to a specific version
sudo ln -s /opt/node-v22/bin/node /usr/local/bin/node
```

`-f` replaces an existing link, `-n` treats an existing link to a directory as a file instead of entering it.

## Hard Link vs Symbolic Link

| Feature | Hard link | Symbolic link |
| :--- | :--- | :--- |
| Inode | Same as target | Its own inode |
| Points to | Inode (data) | Path (name) |
| Across filesystems/partitions | No | Yes |
| Link to a directory | No (not allowed for users) | Yes |
| If target is deleted | Data still available | Link breaks (dangling) |
| `ls -l` type | `-` like the file | `l` with `-> target` |
| Size | Same as file | Length of the path text |
| Command | `ln target name` | `ln -s target name` |

## Broken (Dangling) Links

If the target of a symlink is moved or deleted, the link remains but points nowhere.

```bash
$ rm report.txt
$ cat latest
cat: latest: No such file or directory
$ ls -l latest            # often shown in red by ls --color
lrwxrwxrwx 1 ashu ashu 10 Nov 27 12:05 latest -> report.txt

# find broken links in a tree
$ find /etc -xtype l
# remove them (check the list first!)
$ find ./build -xtype l -delete
```

A **relative** symlink target is resolved from the link's own directory, not from where you ran `ln`. Prefer absolute targets unless the whole tree moves together.

## Interview Questions

**Q1. Why can't a hard link cross partitions?**
Inode numbers are only unique within one filesystem; a directory entry cannot refer to an inode on another one.

**Q2. How do you find all hard links to a file?**
Get its inode with `ls -i file`, then `find / -xdev -inum <number>`, or use `find / -xdev -samefile file`.

**Q3. You deleted a large log but `df` shows no space freed. Why?**
A running process still has the file open, so the inode is not freed. Find it with `lsof +L1` and restart or signal the process (see [processes](../03_Processes/README.md)).

**Q4. Does `rm` on a symlink delete the target?**
No, `rm link` (or `unlink link`) removes only the link. Avoid a trailing slash such as `rm -r link/`, which can act on the target directory instead.

**Q5. Why does a directory have a link count of at least 2?**
Its own entry in the parent, plus its `.` entry. Each subdirectory adds one more through its `..`.
