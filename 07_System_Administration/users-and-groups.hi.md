# Users और Groups

Linux accounts को passwd, shadow और group files में कैसे रखता है, और users, groups व sudo access को सुरक्षित तरीके से कैसे जोड़ें, बदलें और हटाएँ।

## Users और Groups क्यों ज़रूरी हैं

हर process और file किसी **user (UID)** और **group (GID)** की होती है। आप क्या पढ़, लिख या execute कर सकते हैं, यह Linux इन IDs को file [permissions](../02_Filesystem/permissions.md) से मिलाकर तय करता है। Servers पर हर app को अपने अलग, कम-अधिकार वाले user से चलाना चाहिए (जैसे `www-data`, `postgres`)।

| प्रकार | UID range (आम तौर पर) | उदाहरण |
| :--- | :--- | :--- |
| root | 0 | `root` |
| System / service users | 1 से 999 | `www-data`, `sshd`, `nobody` |
| सामान्य users | 1000+ | `ashu`, `deploy` |

## Account Files

### /etc/passwd (सबके लिए पढ़ने योग्य)

```bash
$ grep deploy /etc/passwd
deploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash
```

| Field | Value | मतलब |
| :---: | :--- | :--- |
| 1 | `deploy` | Username |
| 2 | `x` | Password `/etc/shadow` में रखा है |
| 3 | `1001` | UID |
| 4 | `1001` | Primary GID |
| 5 | `Deploy User` | Comment (GECOS) |
| 6 | `/home/deploy` | Home directory |
| 7 | `/bin/bash` | Login shell (`/usr/sbin/nologin` login रोकता है) |

### /etc/shadow (केवल root)

```bash
deploy:$6$Xy...hash...:20050:0:99999:7:::
```

Fields: username, hashed password (`$6$` = SHA-512, `!` या `*` = locked), आख़िरी बदलाव (1970 से दिन), min days, max days, warning days, inactive days, expiry date।

### /etc/group

```bash
docker:x:998:deploy,ashu
```

Fields: group name, password placeholder, GID, और **supplementary** members की comma से अलग list।

## Users बनाना और संभालना

```bash
sudo useradd -m -s /bin/bash -c "Deploy User" deploy   # -m creates /home/deploy
sudo adduser deploy          # Debian/Ubuntu interactive wrapper (asks password too)
sudo passwd deploy           # set or change a password
sudo passwd -l deploy        # lock the account
sudo passwd -e deploy        # force password change at next login
sudo chage -l deploy         # show password ageing info

sudo usermod -aG docker deploy     # ADD to supplementary group docker
sudo usermod -s /usr/sbin/nologin svc   # disable shell login
sudo usermod -L deploy             # lock (same idea as passwd -l)

sudo userdel deploy          # delete user, keep home
sudo userdel -r deploy       # delete user and home directory + mail spool

# System user for a service (no home, no login)
sudo useradd -r -s /usr/sbin/nologin myapp
```

## Groups

```bash
sudo groupadd devops
sudo usermod -aG devops ashu
sudo gpasswd -d ashu devops      # remove ashu from devops
sudo groupdel devops
groups ashu                      # list groups of a user
getent group devops              # works with LDAP too
```

Group के बदलाव **अगले login** पर लागू होते हैं; `newgrp docker` चलाएँ या logout करके फिर login करें।

## मैं कौन हूँ?

```bash
$ whoami
ashu
$ id
uid=1000(ashu) gid=1000(ashu) groups=1000(ashu),27(sudo),998(docker)
$ who            # who is logged in now
$ last -5        # recent logins
```

## sudo और su

| Command | क्या करता है |
| :--- | :--- |
| `su -` | root के environment के साथ root बनना (**root का** password चाहिए) |
| `su - deploy` | दूसरा user बनना |
| `sudo cmd` | एक command root के रूप में चलाना (**आपका** password, log होता है) |
| `sudo -i` | sudo से root login shell |
| `sudo -u postgres psql` | दूसरे user के रूप में command चलाना |
| `sudo -l` | आप क्या-क्या चला सकते हैं, उसकी list |

### /etc/sudoers और visudo

हमेशा `visudo` से edit करें: यह file को lock करता है और syntax check करता है, ताकि एक typo से सबका sudo बंद न हो जाए।

```bash
sudo visudo                         # edit /etc/sudoers
sudo visudo -f /etc/sudoers.d/deploy   # preferred: drop-in file
```

```bash
# user    hosts=(run-as)   commands
root      ALL=(ALL:ALL) ALL
%sudo     ALL=(ALL:ALL) ALL                        # group sudo (Ubuntu); wheel on RHEL
deploy    ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp
```

आख़िरी line **least privilege** का पालन करती है: `deploy` सिर्फ़ एक service restart कर सकता है, और कुछ नहीं।

## आम गलतियाँ

**Q1. `usermod -G docker ashu` ने ashu को बाकी सभी groups से हटा दिया। क्यों?**
`-a` के बिना `-G` supplementary groups की list को *बदल* देता है। हमेशा `usermod -aG` इस्तेमाल करें।

**Q2. `/etc/sudoers` को nano से edit किया और अब sudo टूट गया।**
Syntax error से sudo बंद हो जाता है। Rescue mode में boot करें या `pkexec visudo` से ठीक करें। हमेशा `visudo` इस्तेमाल करें।

**Q3. `userdel` से user हटाया लेकिन files बची रहीं।**
सादा `userdel` home directory रखता है। `-r` इस्तेमाल करें, और बची files `find / -nouser` से ढूँढें।

**Q4. User को group में जोड़ा फिर भी access denied है।**
Group membership login के समय पढ़ी जाती है। Logout करके login करें, या `newgrp <group>` चलाएँ।

**Q5. `/etc/passwd` और `/etc/shadow` में क्या फ़र्क है?**
`passwd` में सबके पढ़ने लायक account जानकारी है; `shadow` में password hashes और ageing data है, जिसे केवल root पढ़ सकता है।
