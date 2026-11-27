# Set Up a Developer and CI Machine

Install and verify build tools, Git, Node.js, Python, Java, PostgreSQL and Redis on Ubuntu, then automate everything with one bootstrap script.

## Use Case

A new teammate joins, or you need a self-hosted CI runner. Starting from a clean Ubuntu 22.04/24.04 box, install a standard toolchain and verify each tool works.

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

## 1. Build Essentials and CLI Utilities

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl wget unzip jq htop ca-certificates
gcc --version | head -1
# gcc (Ubuntu 13.2.0-23ubuntu4) 13.2.0
```

`build-essential` brings `gcc`, `g++`, `make` and libc headers, which native npm and pip packages need to compile.

## 2. Git

```bash
sudo apt-get install -y git
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

For pushing to GitHub, create an SSH key: `ssh-keygen -t ed25519 -C "you@example.com"` and add `~/.ssh/id_ed25519.pub` to your account.

## 3. Node.js

Ubuntu's own `nodejs` package is usually old. Two good options:

### Option A: nvm (recommended for developers)

nvm installs Node per user, needs no `sudo` and lets you switch versions per project.

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

## 4. Python 3, pip and venv

```bash
sudo apt-get install -y python3 python3-pip python3-venv
python3 --version
# Python 3.12.3
python3 -m venv .venv
source .venv/bin/activate
pip install requests
deactivate
```

On Ubuntu 24.04, `pip install` outside a venv fails with `externally-managed-environment`. Always use a venv (or `pipx` for CLI tools).

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

Inside `psql`, create an app user and database:

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

Run it with `bash bootstrap-dev.sh`. `set -euo pipefail` stops at the first failing command, unset variable or failing pipe stage. Scripting details are in [shell scripting](../05_Shell_Scripting/README.md).

## Common Mistakes

| Mistake | Fix |
| :--- | :--- |
| `nvm: command not found` | Open a new shell or `source ~/.bashrc` |
| `externally-managed-environment` from pip | Use `python3 -m venv` or `pipx` |
| `sudo npm install -g` permission mess | Use nvm; global installs then go to your home directory |
| `psql: FATAL: role "ubuntu" does not exist` | Connect as `sudo -u postgres psql` or create that role |
| CI job prompts and hangs | `DEBIAN_FRONTEND=noninteractive` and `-y` |

## Interview Questions

**Q1. Why use nvm instead of `apt install nodejs`?**
The distro version is often outdated, and nvm lets each project pin its own Node version without root.

**Q2. What does `set -euo pipefail` do?**
`-e` exits on error, `-u` errors on unset variables, `pipefail` makes a pipeline fail if any command in it fails.

**Q3. Why a Python virtual environment?**
It isolates project dependencies from system Python and from other projects.

**Q4. How do you connect to PostgreSQL right after install?**
Switch to the `postgres` OS user, which maps to the `postgres` superuser role: `sudo -u postgres psql`.

**Q5. What is in `build-essential`?**
`gcc`, `g++`, `make`, `dpkg-dev` and libc development headers needed to compile native code.
