# Developer aur CI Machine Set Up Karna

Ubuntu par build tools, Git, Node.js, Python, Java, PostgreSQL aur Redis install aur verify karo, phir sab kuch ek bootstrap script se automate karo.

## Use Case

Naya teammate join karta hai, ya aapko self-hosted CI runner chahiye. Saaf Ubuntu 22.04/24.04 box se shuru karke standard toolchain install karo aur har tool ko verify karo.

## Quick Reference

| Tool | Install | Verify |
| :--- | :--- | :--- |
| Build tools | `sudo apt install -y build-essential` | `gcc --version`, `make --version` |
| Git | `sudo apt install -y git` | `git --version` |
| CLI utilities | `sudo apt install -y curl wget unzip jq htop` | `jq --version` |
| Node.js | `nvm install --lts` | `node -v`, `npm -v` |
| Python | `sudo apt install -y python3 python3-pip python3-venv` | `python3 --version` |
| Java | `sudo apt install -y openjdk-17-jdk` | `java -version` |
| PostgreSQL | `sudo apt install -y postgresql` | `sudo -u postgres psql -c 'SELECT version();'` |
| Redis | `sudo apt install -y redis-server` | `redis-cli ping` |

## 1. Build Essentials aur CLI Utilities

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl wget unzip jq htop ca-certificates
gcc --version | head -1
# gcc (Ubuntu 13.2.0-23ubuntu4) 13.2.0
```

`build-essential` `gcc`, `g++`, `make` aur libc headers laata hai, jo native npm aur pip packages compile karne ke liye chahiye.

## 2. Git

```bash
sudo apt-get install -y git
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

GitHub par push karne ke liye SSH key banao: `ssh-keygen -t ed25519 -C "you@example.com"` aur `~/.ssh/id_ed25519.pub` apne account mein add karo.

## 3. Node.js

Ubuntu ka apna `nodejs` package aksar purana hota hai. Do achhe options hain:

### Option A: nvm (developers ke liye recommended)

nvm har user ke liye Node install karta hai, `sudo` nahi maangta aur har project ke liye version switch karne deta hai.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
node -v
# v22.11.0
```

### Option B: NodeSource repository (system-wide, servers)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 4. Python 3, pip aur venv

```bash
sudo apt-get install -y python3 python3-pip python3-venv
python3 --version
# Python 3.12.3
python3 -m venv .venv
source .venv/bin/activate
pip install requests
deactivate
```

Ubuntu 24.04 par venv ke bahar `pip install` `externally-managed-environment` error ke saath fail hota hai. Hamesha venv use karo (ya CLI tools ke liye `pipx`).

## 5. Java (OpenJDK 17)

```bash
sudo apt-get install -y openjdk-17-jdk
java -version
# openjdk version "17.0.13" 2024-10-15
```

## 6. PostgreSQL

```bash
sudo apt-get install -y postgresql
systemctl status postgresql --no-pager
sudo -u postgres psql
```

`psql` ke andar app user aur database banao:

```sql
CREATE USER appuser WITH PASSWORD 'change-me';
CREATE DATABASE appdb OWNER appuser;
\q
```

```bash
psql -h localhost -U appuser -d appdb -c 'SELECT 1;'
```

## 7. Redis

```bash
sudo apt-get install -y redis-server
sudo systemctl enable --now redis-server
redis-cli ping
# PONG
```

## 8. One-Shot Bootstrap Script

```bash
#!/usr/bin/env bash
# bootstrap-dev.sh - install a dev toolchain on Ubuntu
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get install -y build-essential git curl wget unzip jq htop ca-certificates \
  python3 python3-pip python3-venv openjdk-17-jdk postgresql redis-server
sudo systemctl enable --now postgresql redis-server

# Node.js via nvm for the current user
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] || curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
set +u; . "$NVM_DIR/nvm.sh"; nvm install --lts; set -u   # nvm is not nounset-safe

for cmd in gcc git jq python3 java psql redis-cli node; do
  printf '%-10s %s\n' "$cmd" "$(command -v "$cmd")"
done
echo "Done."
```

Ise `bash bootstrap-dev.sh` se chalao. `set -euo pipefail` pehli fail hone wali command, unset variable ya fail hue pipe stage par ruk jaata hai. Scripting ki details [shell scripting](../05_Shell_Scripting/README.md) mein hain.

## Common Mistakes

| Galti | Fix |
| :--- | :--- |
| `nvm: command not found` | Naya shell kholo ya `source ~/.bashrc` |
| pip se `externally-managed-environment` | `python3 -m venv` ya `pipx` use karo |
| `sudo npm install -g` se permission ki gadbad | nvm use karo; global installs phir home directory mein jaate hain |
| `psql: FATAL: role "ubuntu" does not exist` | `sudo -u postgres psql` se connect karo ya wo role banao |
| CI job prompt karke atak jaata hai | `DEBIAN_FRONTEND=noninteractive` aur `-y` |

## Interview Questions

**Q1. `apt install nodejs` ki jagah nvm kyun?**
Distro version aksar purana hota hai, aur nvm har project ko bina root ke apna Node version pin karne deta hai.

**Q2. `set -euo pipefail` kya karta hai?**
`-e` error par exit karta hai, `-u` unset variables par error deta hai, `pipefail` pipeline ko fail karta hai agar usme koi bhi command fail ho.

**Q3. Python virtual environment kyun?**
Ye project dependencies ko system Python aur doosre projects se alag rakhta hai.

**Q4. Install ke turant baad PostgreSQL se kaise connect karein?**
`postgres` OS user par switch karo, jo `postgres` superuser role se map hota hai: `sudo -u postgres psql`.

**Q5. `build-essential` mein kya hota hai?**
`gcc`, `g++`, `make`, `dpkg-dev` aur libc development headers, jo native code compile karne ke liye chahiye.
