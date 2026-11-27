# Hard Links aur Symbolic Links

Hard links inode kaise share karte hain, symlinks path ko kaise point karte hain, ln aur ln -s, main differences, aur broken links dhoondhna aur theek karna.

## File Ko Doosra Naam Dene Ke Do Tareeke

[Paths and inodes](paths-and-inodes.md) se yaad karo ki directory entry ek **naam** ko ek **inode number** se map karti hai. Links isi par bane hain:

- **Hard link**: doosri directory entry jo **same inode** ko point karti hai. Dono naam barabar hain; koi bhi "original" nahi.
- **Symbolic (soft) link**: ek chhoti alag file, apne khud ke inode ke saath, jiska content kisi doosri file ka **path** hota hai. Shortcut jaisa.

```text
hard link:    report.txt ----\
                              >---- inode 1048700 ---- data blocks
              backup.txt ----/

symlink:      latest -> report.txt     (inode 1048755 holds the text "report.txt")
```

## ln Se Hard Links

```bash
$ echo "Q4 numbers" > report.txt
$ ln report.txt backup.txt
$ ls -li report.txt backup.txt
1048700 -rw-r--r-- 2 ashu ashu 11 Nov 27 12:00 backup.txt
1048700 -rw-r--r-- 2 ashu ashu 11 Nov 27 12:00 report.txt
```

Inode number same hai, aur link count ab **2** hai. Ek naam se edit karo toh dono naam se badla hua content dikhega.

```bash
$ rm report.txt
$ cat backup.txt          # still works
Q4 numbers
$ ls -li backup.txt       # link count back to 1
1048700 -rw-r--r-- 1 ashu ashu 11 Nov 27 12:00 backup.txt
```

Data tabhi free hota hai jab link count 0 ho jaaye aur koi process file ko open na rakhe.

## ln -s Se Symbolic Links

```bash
$ ln -s report.txt latest
$ ls -li latest
1048755 lrwxrwxrwx 1 ashu ashu 10 Nov 27 12:05 latest -> report.txt
$ readlink latest
report.txt
$ readlink -f latest      # full resolved path
/home/ashu/report.txt
```

Dekho: type `l` hai, apna inode hai, aur size 10 hai (text `report.txt` ki length). Symlink ki permissions hamesha `rwxrwxrwx` dikhti hain; access target par check hota hai.

DevOps mein typical use:

```bash
# enable an nginx site
sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/
# zero-downtime deploys: switch "current" to a new release
ln -sfn /srv/app/releases/2026-11-27 /srv/app/current
# point a tool to a specific version
sudo ln -s /opt/node-v22/bin/node /usr/local/bin/node
```

`-f` existing link ko replace karta hai, `-n` directory wale existing link ko andar ghusne ki jagah file ki tarah treat karta hai.

## Hard Link vs Symbolic Link

| Feature | Hard link | Symbolic link |
| :--- | :--- | :--- |
| Inode | Target jaisa same | Apna alag inode |
| Point karta hai | Inode (data) ko | Path (naam) ko |
| Filesystems/partitions ke paar | Nahi | Haan |
| Directory ka link | Nahi (users ke liye allowed nahi) | Haan |
| Target delete ho jaaye | Data abhi bhi milta hai | Link toot jaata hai (dangling) |
| `ls -l` type | `-` file jaisa | `l` ke saath `-> target` |
| Size | File jitna | Path text ki length |
| Command | `ln target name` | `ln -s target name` |

## Broken (Dangling) Links

Agar symlink ka target move ya delete ho jaaye, toh link reh jaata hai par kahin point nahi karta.

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

**Relative** symlink target link ki apni directory se resolve hota hai, us jagah se nahi jahan tumne `ln` chalaya tha. Absolute targets prefer karo, jab tak poora tree ek saath move na hota ho.

## Interview Questions

**Q1. Hard link partitions ke paar kyun nahi ja sakta?**
Inode numbers sirf ek filesystem ke andar unique hote hain; directory entry doosre filesystem ke inode ko refer nahi kar sakti.

**Q2. Kisi file ke saare hard links kaise dhoondhoge?**
`ls -i file` se inode lo, phir `find / -xdev -inum <number>`, ya `find / -xdev -samefile file` use karo.

**Q3. Badi log file delete ki par `df` mein space free nahi hua. Kyun?**
Koi running process abhi bhi file ko open rakhe hue hai, isliye inode free nahi hua. `lsof +L1` se dhoondo aur process ko restart ya signal karo (dekho [processes](../03_Processes/README.md)).

**Q4. Kya symlink par `rm` target ko delete karta hai?**
Nahi, `rm link` (ya `unlink link`) sirf link hatata hai. `rm -r link/` jaisa trailing slash avoid karo, woh target directory par act kar sakta hai.

**Q5. Directory ka link count kam se kam 2 kyun hota hai?**
Parent mein uski apni entry, plus uski `.` entry. Har subdirectory apne `..` se ek aur jodti hai.
