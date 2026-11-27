# डेवलपर और CI मशीन तैयार करना

Ubuntu पर build tools, Git, Node.js, Python, Java, PostgreSQL और Redis इंस्टॉल करके जाँचें, फिर सब कुछ एक bootstrap script से automate करें।

## Use Case

कोई नया साथी team में आता है, या आपको self-hosted CI runner चाहिए। साफ़ Ubuntu 22.04/24.04 box से शुरू करके standard toolchain इंस्टॉल करें और हर tool को जाँचें।

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

## 1. Build Essentials और CLI Utilities

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl wget unzip jq htop ca-certificates
gcc --version | head -1
# gcc (Ubuntu 13.2.0-23ubuntu4) 13.2.0
```

`build-essential` `gcc`, `g++`, `make` और libc headers लाता है, जो native npm और pip packages compile करने के लिए ज़रूरी हैं।

## 2. Git

```bash
sudo apt-get install -y git
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

GitHub पर push करने के लिए SSH key बनाएँ: `ssh-keygen -t ed25519 -C "you@example.com"` और `~/.ssh/id_ed25519.pub` अपने account में जोड़ें।

## 3. Node.js

Ubuntu का अपना `nodejs` package अक्सर पुराना होता है। दो अच्छे विकल्प हैं:

### Option A: nvm (developers के लिए सुझाया गया)

nvm हर user के लिए Node इंस्टॉल करता है, `sudo` नहीं माँगता और हर project के लिए version बदलने देता है।

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

## 4. Python 3, pip और venv

```bash
sudo apt-get install -y python3 python3-pip python3-venv
python3 --version
# Python 3.12.3
python3 -m venv .venv
source .venv/bin/activate
pip install requests
deactivate
```

Ubuntu 24.04 पर venv के बाहर `pip install` `externally-managed-environment` error के साथ fail होता है। हमेशा venv इस्तेमाल करें (या CLI tools के लिए `pipx`)।

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

`psql` के अंदर app user और database बनाएँ:

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

इसे `bash bootstrap-dev.sh` से चलाएँ। `set -euo pipefail` पहली fail होने वाली command, unset variable या fail हुए pipe stage पर रुक जाता है। Scripting की जानकारी [shell scripting](../05_Shell_Scripting/README.md) में है।

## आम गलतियाँ

| गलती | समाधान |
| :--- | :--- |
| `nvm: command not found` | नया shell खोलें या `source ~/.bashrc` |
| pip से `externally-managed-environment` | `python3 -m venv` या `pipx` इस्तेमाल करें |
| `sudo npm install -g` से permission की गड़बड़ | nvm इस्तेमाल करें; global installs फिर home directory में जाते हैं |
| `psql: FATAL: role "ubuntu" does not exist` | `sudo -u postgres psql` से connect करें या वह role बनाएँ |
| CI job prompt पर अटक जाता है | `DEBIAN_FRONTEND=noninteractive` और `-y` |

## Interview Questions

**Q1. `apt install nodejs` की जगह nvm क्यों?**
Distro का version अक्सर पुराना होता है, और nvm हर project को बिना root के अपना Node version तय करने देता है।

**Q2. `set -euo pipefail` क्या करता है?**
`-e` error पर बाहर निकलता है, `-u` unset variables पर error देता है, `pipefail` pipeline को fail करता है अगर उसमें कोई भी command fail हो।

**Q3. Python virtual environment क्यों?**
यह project dependencies को system Python और दूसरे projects से अलग रखता है।

**Q4. Install के तुरंत बाद PostgreSQL से कैसे जुड़ें?**
`postgres` OS user पर switch करें, जो `postgres` superuser role से जुड़ा है: `sudo -u postgres psql`।

**Q5. `build-essential` में क्या होता है?**
`gcc`, `g++`, `make`, `dpkg-dev` और libc development headers, जो native code compile करने के लिए चाहिए।
