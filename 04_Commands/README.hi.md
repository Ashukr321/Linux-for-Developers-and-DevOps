# ज़रूरी Linux कमांड्स

डेवलपर्स के लिए रोज़ की Linux कमांड्स: login, help, navigation, फ़ाइल handling, wildcards और expr व bc से गणना, साथ में एक reference table।

## Login और Logout

Linux session login से शुरू होता है (local console, `ssh`, या desktop का terminal)। Authentication के बाद सिस्टम आपका login shell चालू करता है ([shells](../01_Introduction/shells.md) देखें)।

```bash
ssh ubuntu@10.0.0.12     # log in to a remote server
whoami                   # which user am I?
who                      # who is logged in right now
exit                     # end the shell (Ctrl+D does the same)
logout                   # end a login shell
```

## Internal बनाम External कमांड्स

| प्रकार | कहाँ रहती है | उदाहरण | नया process बनता है? |
| :--- | :--- | :--- | :---: |
| Internal (builtin) | Shell के अंदर ही | `cd`, `echo`, `pwd`, `export`, `type`, `exit` | नहीं |
| External | Disk पर binary, `$PATH` से मिलती है | `ls`, `cp`, `grep`, `cat` | हाँ (fork + exec) |

`cd` का builtin होना ज़रूरी है: child process अपने parent की working directory नहीं बदल सकता।

```bash
$ type cd
cd is a shell builtin
$ type ls
ls is aliased to `ls --color=auto'
$ type -a echo
echo is a shell builtin
echo is /usr/bin/echo
```

## मदद कैसे लें

```bash
man ls            # full manual page (q to quit, /word to search)
man 5 passwd      # section 5 = file formats (section 1 = commands)
ls --help         # short usage for most GNU tools
help cd           # help for bash builtins
apropos copy      # search man pages by keyword (same as man -k)
```

## Navigation और फ़ाइल कमांड्स

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

Paths और inodes [paths and inodes](../02_Filesystem/paths-and-inodes.md) में समझाए गए हैं; फ़ाइल access [permissions](../02_Filesystem/permissions.md) में।

## Wildcards (Globbing)

Wildcards को कमांड चलने से पहले **shell** expand करता है।

| Pattern | किससे match करता है | उदाहरण |
| :--- | :--- | :--- |
| `*` | कितने भी characters | `ls *.log` |
| `?` | ठीक एक character | `ls file?.txt` → `file1.txt`, `fileA.txt` |
| `[abc]` | Set में से एक character | `ls report[123].csv` |
| `[0-9]` | Range में से एक character | `rm backup-[0-9].tar` |
| `[!x]` | Set से बाहर का एक character | `ls [!.]*` |

```bash
$ echo *.sh          # see what a glob expands to before using rm
deploy.sh test.sh
```

## गणना: expr और bc

`expr` सिर्फ़ integer गणना करता है; operators के आसपास space चाहिए और `*` को escape करना पड़ता है।

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

`bc` दशमलव (decimal) वाला calculator है:

```bash
$ echo "10 / 3" | bc
3
$ echo "scale=2; 10 / 3" | bc
3.33
$ echo "scale=2; 512 / 1024 * 100" | bc
50.00
```

## कमांड Reference Table

| कमांड | काम | उपयोगी flags |
| :--- | :--- | :--- |
| `pwd` | मौजूदा directory दिखाए | `-P` symlinks resolve करे |
| `ls` | Directory की सूची | `-l -a -h -t -r -R` |
| `cd` | Directory बदले | `-` पिछली dir |
| `mkdir` | Directory बनाए | `-p` parents |
| `touch` | फ़ाइल बनाए / समय update करे | `-t` समय set करे |
| `cat` | फ़ाइल दिखाए / जोड़े | `-n` line नंबर |
| `cp` | Copy | `-r -i -p -v` |
| `mv` | Move / rename | `-i -n -v` |
| `rm` | Delete | `-r -i -f` |
| `type` | Builtin या external? | `-a` सभी matches |
| `man` | Manual | `-k` keyword search |
| `expr` / `bc` | गणना | bc में `scale=` |

आगे पढ़ें: [filters and pipes](filters-and-pipes.md) और [redirection](redirection.md)।

## Interview प्रश्न

**Q1. `cd` external कमांड क्यों नहीं, builtin क्यों है?**
External कमांड child process में चलती है; child की directory बदलने से parent shell पर कोई असर नहीं पड़ता।

**Q2. कैसे पता करें कि कमांड builtin है, alias है या binary?**
`type -a name` चलाएँ; `which` सिर्फ़ `$PATH` में ढूँढता है।

**Q3. गलत directory में `rm -rf *` चलाने से क्या होगा, और इससे कैसे बचें?**
वहाँ की सारी चीज़ें बिना पूछे delete हो जाएँगी। पहले `pwd` चलाएँ, `echo *` या `ls` से preview करें, और जोखिम वाले delete के लिए `rm -ri` इस्तेमाल करें।

**Q4. `*.txt` को कौन expand करता है: shell या `ls`?**
Shell। `ls` को पहले से expand हुई फ़ाइल-नामों की सूची मिलती है।

**Q5. Shell में भाग (division) का दशमलव जवाब कैसे पाएँ?**
`expr` और `$(( ))` सिर्फ़ integer देते हैं; `echo "scale=2; 7/2" | bc` इस्तेमाल करें।
