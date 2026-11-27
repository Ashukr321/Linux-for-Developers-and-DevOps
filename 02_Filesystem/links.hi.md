# Hard Links और Symbolic Links

Hard links inode कैसे साझा करते हैं, symbolic links path की ओर कैसे इशारा करते हैं, ln और ln -s, मुख्य अंतर, और टूटे links ढूँढना व ठीक करना।

## फ़ाइल को दूसरा नाम देने के दो तरीके

[Paths and inodes](paths-and-inodes.md) से याद करें कि directory entry एक **नाम** को एक **inode number** से जोड़ती है। Links इसी पर बने हैं:

- **Hard link**: दूसरी directory entry जो **उसी inode** की ओर इशारा करती है। दोनों नाम बराबर हैं; कोई भी "original" नहीं है।
- **Symbolic (soft) link**: एक छोटी अलग फ़ाइल, अपने ख़ुद के inode के साथ, जिसका content किसी दूसरी फ़ाइल का **path** होता है। Shortcut जैसा।

```text
hard link:    report.txt ----\
                              >---- inode 1048700 ---- data blocks
              backup.txt ----/

symlink:      latest -> report.txt     (inode 1048755 holds the text "report.txt")
```

## ln से Hard Links

```bash
$ echo "Q4 numbers" > report.txt
$ ln report.txt backup.txt
$ ls -li report.txt backup.txt
1048700 -rw-r--r-- 2 ashu ashu 11 Nov 27 12:00 backup.txt
1048700 -rw-r--r-- 2 ashu ashu 11 Nov 27 12:00 report.txt
```

Inode number एक ही है, और link count अब **2** है। एक नाम से edit करें तो दोनों नामों से बदला हुआ content दिखेगा।

```bash
$ rm report.txt
$ cat backup.txt          # still works
Q4 numbers
$ ls -li backup.txt       # link count back to 1
1048700 -rw-r--r-- 1 ashu ashu 11 Nov 27 12:00 backup.txt
```

Data तभी free होता है जब link count 0 हो जाए और कोई process फ़ाइल को खोले न रखे।

## ln -s से Symbolic Links

```bash
$ ln -s report.txt latest
$ ls -li latest
1048755 lrwxrwxrwx 1 ashu ashu 10 Nov 27 12:05 latest -> report.txt
$ readlink latest
report.txt
$ readlink -f latest      # full resolved path
/home/ashu/report.txt
```

ध्यान दें: type `l` है, अपना inode है, और size 10 है (text `report.txt` की लंबाई)। Symlink की permissions हमेशा `rwxrwxrwx` दिखती हैं; access target पर जाँचा जाता है।

DevOps में आम उपयोग:

```bash
# enable an nginx site
sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/
# zero-downtime deploys: switch "current" to a new release
ln -sfn /srv/app/releases/2026-11-27 /srv/app/current
# point a tool to a specific version
sudo ln -s /opt/node-v22/bin/node /usr/local/bin/node
```

`-f` मौजूदा link को बदल देता है, `-n` डायरेक्टरी वाले मौजूदा link के अंदर जाने के बजाय उसे फ़ाइल की तरह मानता है।

## Hard Link बनाम Symbolic Link

| विशेषता | Hard link | Symbolic link |
| :--- | :--- | :--- |
| Inode | Target वाला ही | अपना अलग inode |
| इशारा करता है | Inode (data) की ओर | Path (नाम) की ओर |
| Filesystems/partitions के पार | नहीं | हाँ |
| डायरेक्टरी का link | नहीं (users के लिए अनुमति नहीं) | हाँ |
| Target delete हो जाए | Data फिर भी मिलता है | Link टूट जाता है (dangling) |
| `ls -l` type | `-` फ़ाइल जैसा | `l` के साथ `-> target` |
| Size | फ़ाइल जितना | Path text की लंबाई |
| Command | `ln target name` | `ln -s target name` |

## टूटे (Dangling) Links

अगर symlink का target move या delete हो जाए, तो link बचा रहता है पर कहीं इशारा नहीं करता।

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

**Relative** symlink target link की अपनी डायरेक्टरी से resolve होता है, उस जगह से नहीं जहाँ आपने `ln` चलाया था। जब तक पूरा ट्री एक साथ move न हो, absolute targets बेहतर हैं।

## इंटरव्यू प्रश्न

**Q1. Hard link partitions के पार क्यों नहीं जा सकता?**
Inode numbers सिर्फ़ एक filesystem के अंदर unique होते हैं; directory entry दूसरे filesystem के inode को refer नहीं कर सकती।

**Q2. किसी फ़ाइल के सारे hard links कैसे ढूँढेंगे?**
`ls -i file` से inode लें, फिर `find / -xdev -inum <number>`, या `find / -xdev -samefile file` का उपयोग करें।

**Q3. बड़ी log फ़ाइल delete की पर `df` में जगह खाली नहीं हुई। क्यों?**
कोई चल रहा process अब भी फ़ाइल को खोले हुए है, इसलिए inode free नहीं हुआ। `lsof +L1` से ढूँढें और process को restart या signal करें (देखें [processes](../03_Processes/README.md))।

**Q4. क्या symlink पर `rm` target को delete करता है?**
नहीं, `rm link` (या `unlink link`) सिर्फ़ link हटाता है। `rm -r link/` जैसे trailing slash से बचें, वह target डायरेक्टरी पर असर कर सकता है।

**Q5. डायरेक्टरी का link count कम से कम 2 क्यों होता है?**
Parent में उसकी अपनी entry, और उसकी `.` entry। हर subdirectory अपने `..` से एक और जोड़ती है।
