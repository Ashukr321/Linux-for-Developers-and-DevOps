# Users and Groups

How Linux stores accounts in passwd, shadow and group files, and how to add, modify and remove users, groups and sudo access safely.

## Why Users and Groups Matter

Every process and file belongs to a **user (UID)** and a **group (GID)**. Linux decides what you can read, write or execute by comparing these IDs with the file [permissions](../02_Filesystem/permissions.md). On servers, each app should run as its own unprivileged user (e.g. `www-data`, `postgres`).

| Type | UID range (typical) | Example |
| :--- | :--- | :--- |
| root | 0 | `root` |
| System / service users | 1 to 999 | `www-data`, `sshd`, `nobody` |
| Regular users | 1000+ | `ashu`, `deploy` |

## The Account Files

### /etc/passwd (world-readable)

```bash
$ grep deploy /etc/passwd
deploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash
```

| Field | Value | Meaning |
| :---: | :--- | :--- |
| 1 | `deploy` | Username |
| 2 | `x` | Password is stored in `/etc/shadow` |
| 3 | `1001` | UID |
| 4 | `1001` | Primary GID |
| 5 | `Deploy User` | Comment (GECOS) |
| 6 | `/home/deploy` | Home directory |
| 7 | `/bin/bash` | Login shell (`/usr/sbin/nologin` blocks login) |

### /etc/shadow (root only)

```bash
deploy:$6$Xy...hash...:20050:0:99999:7:::
```

Fields: username, hashed password (`$6$` = SHA-512, `!` or `*` = locked), last change (days since 1970), min days, max days, warning days, inactive days, expiry date.

### /etc/group

```bash
docker:x:998:deploy,ashu
```

Fields: group name, password placeholder, GID, comma-separated list of **supplementary** members.

## Creating and Managing Users

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

Group changes apply at the **next login**; use `newgrp docker` or log out and back in.

## Who Am I?

```bash
$ whoami
ashu
$ id
uid=1000(ashu) gid=1000(ashu) groups=1000(ashu),27(sudo),998(docker)
$ who            # who is logged in now
$ last -5        # recent logins
```

## sudo and su

| Command | What it does |
| :--- | :--- |
| `su -` | Switch to root with root's environment (needs **root's** password) |
| `su - deploy` | Become another user |
| `sudo cmd` | Run one command as root (needs **your** password, logged) |
| `sudo -i` | Root login shell via sudo |
| `sudo -u postgres psql` | Run a command as another user |
| `sudo -l` | List what you are allowed to run |

### /etc/sudoers and visudo

Always edit with `visudo`: it locks the file and checks syntax, so a typo cannot lock everyone out of sudo.

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

The last line follows **least privilege**: `deploy` can restart one service, nothing else.

## Common Mistakes

**Q1. `usermod -G docker ashu` removed ashu from all other groups. Why?**
Without `-a`, `-G` *replaces* the supplementary group list. Always use `usermod -aG`.

**Q2. I edited `/etc/sudoers` with nano and now sudo is broken.**
A syntax error disables sudo. Boot into rescue mode or use `pkexec visudo` to fix it. Always use `visudo`.

**Q3. Deleted a user with `userdel` but files remain.**
Plain `userdel` keeps the home directory. Use `-r`, and find leftovers with `find / -nouser`.

**Q4. Added a user to a group but access is still denied.**
Group membership is read at login. Log out and in, or run `newgrp <group>`.

**Q5. What is the difference between `/etc/passwd` and `/etc/shadow`?**
`passwd` is world-readable account info; `shadow` holds password hashes and ageing data and is readable only by root.
