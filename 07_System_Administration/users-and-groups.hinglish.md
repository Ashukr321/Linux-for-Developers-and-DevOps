# Users aur Groups

Linux accounts ko passwd, shadow aur group files mein kaise rakhta hai, aur users, groups va sudo access ko safely kaise add, modify aur remove karein.

## Users aur Groups kyun zaroori hain

Har process aur file kisi **user (UID)** aur **group (GID)** ki hoti hai. Aap kya read, write ya execute kar sakte ho, ye Linux in IDs ko file [permissions](../02_Filesystem/permissions.md) se match karke decide karta hai. Servers par har app ko apne alag, kam-privilege wale user se chalana chahiye (jaise `www-data`, `postgres`).

| Type | UID range (typical) | Example |
| :--- | :--- | :--- |
| root | 0 | `root` |
| System / service users | 1 se 999 | `www-data`, `sshd`, `nobody` |
| Regular users | 1000+ | `ashu`, `deploy` |

## Account Files

### /etc/passwd (sab padh sakte hain)

```bash
$ grep deploy /etc/passwd
deploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash
```

| Field | Value | Matlab |
| :---: | :--- | :--- |
| 1 | `deploy` | Username |
| 2 | `x` | Password `/etc/shadow` mein stored hai |
| 3 | `1001` | UID |
| 4 | `1001` | Primary GID |
| 5 | `Deploy User` | Comment (GECOS) |
| 6 | `/home/deploy` | Home directory |
| 7 | `/bin/bash` | Login shell (`/usr/sbin/nologin` login block karta hai) |

### /etc/shadow (sirf root)

```bash
deploy:$6$Xy...hash...:20050:0:99999:7:::
```

Fields: username, hashed password (`$6$` = SHA-512, `!` ya `*` = locked), last change (1970 se din), min days, max days, warning days, inactive days, expiry date.

### /etc/group

```bash
docker:x:998:deploy,ashu
```

Fields: group name, password placeholder, GID, aur **supplementary** members ki comma-separated list.

## Users banana aur manage karna

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

Group changes **next login** par apply hote hain; `newgrp docker` chalao ya logout karke dobara login karo.

## Main kaun hoon?

```bash
$ whoami
ashu
$ id
uid=1000(ashu) gid=1000(ashu) groups=1000(ashu),27(sudo),998(docker)
$ who            # who is logged in now
$ last -5        # recent logins
```

## sudo aur su

| Command | Kya karta hai |
| :--- | :--- |
| `su -` | root ke environment ke saath root banna (**root ka** password chahiye) |
| `su - deploy` | Doosra user banna |
| `sudo cmd` | Ek command root ke roop mein chalana (**aapka** password, log hota hai) |
| `sudo -i` | sudo se root login shell |
| `sudo -u postgres psql` | Doosre user ke roop mein command chalana |
| `sudo -l` | Aap kya-kya chala sakte ho, uski list |

### /etc/sudoers aur visudo

Hamesha `visudo` se edit karo: ye file ko lock karta hai aur syntax check karta hai, taaki ek typo se sabka sudo band na ho jaaye.

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

Last line **least privilege** follow karti hai: `deploy` sirf ek service restart kar sakta hai, aur kuch nahi.

## Common Mistakes

**Q1. `usermod -G docker ashu` ne ashu ko baaki sab groups se hata diya. Kyun?**
`-a` ke bina `-G` supplementary group list ko *replace* kar deta hai. Hamesha `usermod -aG` use karo.

**Q2. `/etc/sudoers` ko nano se edit kiya aur ab sudo toot gaya.**
Syntax error se sudo disable ho jaata hai. Rescue mode mein boot karo ya `pkexec visudo` se fix karo. Hamesha `visudo` use karo.

**Q3. `userdel` se user delete kiya lekin files bachi reh gayi.**
Plain `userdel` home directory rakhta hai. `-r` use karo, aur bachi files `find / -nouser` se dhoondo.

**Q4. User ko group mein add kiya phir bhi access denied hai.**
Group membership login ke time padhi jaati hai. Logout karke login karo, ya `newgrp <group>` chalao.

**Q5. `/etc/passwd` aur `/etc/shadow` mein kya fark hai?**
`passwd` mein sabke padhne layak account info hai; `shadow` mein password hashes aur ageing data hai, jo sirf root padh sakta hai.
