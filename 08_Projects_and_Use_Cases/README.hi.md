# apt से पैकेज मैनेजमेंट

Ubuntu और Debian पर apt और dpkg से software इंस्टॉल, अपडेट और हटाएँ, third-party repositories सुरक्षित रूप से जोड़ें, और commands को dnf और apk से मिलाएँ।

## यह Section क्यों

यह module practical है: आपके पास एक नया Ubuntu 22.04/24.04 server है, अब उसे काम का बनाना है। हर recipe package manager से शुरू होती है, इसलिए पहले इसे सीखें।

- [Nginx इंस्टॉल और configure करना](install-nginx.md)
- [Developer / CI machine तैयार करना](install-dev-tools.md)
- [Docker इंस्टॉल करना](install-docker.md)
- [शुरुआती server setup](server-setup.md)

इन packages से चलने वाली services systemd से संभाली जाती हैं, देखें [system administration basics](../07_System_Administration/README.md)।

## 1. हमेशा पहले `apt-get update` चलाएँ

apt **package index की local copy** (नाम, versions, download URLs) `/var/lib/apt/lists/` में रखता है। `update` हर repository से नया index download करता है। यह कुछ भी इंस्टॉल या upgrade **नहीं** करता।

| Command | क्या करता है |
| :--- | :--- |
| `sudo apt update` | सिर्फ़ package index refresh करता है |
| `sudo apt upgrade` | इंस्टॉल packages upgrade करता है; कभी package नहीं हटाता |
| `sudo apt full-upgrade` | Upgrade करता है और dependencies बदलने पर packages हटा/जोड़ भी सकता है |
| `sudo apt autoremove` | वे dependencies हटाता है जिनकी अब किसी को ज़रूरत नहीं |

```bash
sudo apt update
# Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
# Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
# 23 packages can be upgraded. Run 'apt list --upgradable' to see them.
sudo apt upgrade -y
```

नए server पर `update` छोड़ने से `E: Unable to locate package` या `404 Not Found` मिलता है, क्योंकि index पुराना या खाली है।

## 2. `apt` बनाम `apt-get`

`apt` आसान interactive front end है (progress bar, रंग)। `apt-get` और `apt-cache` का **output और interface स्थिर** है, इसलिए scripts में इन्हीं का इस्तेमाल करें। apt ख़ुद चेतावनी देता है: "apt does not have a stable CLI interface"।

## 3. Install, Remove, Purge

```bash
sudo apt install nginx curl git        # install one or more packages
sudo apt install nginx=1.24.0-2ubuntu7 # install a specific version
sudo apt remove nginx                  # remove binaries, keep config in /etc
sudo apt purge nginx                   # remove binaries AND config files
sudo apt autoremove --purge            # clean orphaned dependencies
sudo apt clean                         # empty the .deb cache in /var/cache/apt/archives
```

## 4. Search और Inspect

```bash
apt search redis                 # search names and descriptions
apt show nginx                   # version, size, dependencies, homepage
apt list --installed | grep nginx
# nginx/noble-updates,now 1.24.0-2ubuntu7.1 amd64 [installed]
apt list --upgradable
apt-cache policy nginx           # installed vs candidate version and source repo
```

## 5. dpkg: Low-Level Tool

apt dependencies resolve करता है और download करता है; **dpkg** सिर्फ़ एक local `.deb` file इंस्टॉल करता है।

```bash
sudo dpkg -i package.deb         # install a local .deb (no dependency resolution)
sudo apt-get install -f          # fix missing dependencies after dpkg -i
sudo apt install ./package.deb   # better: apt installs the .deb with dependencies
dpkg -l | grep nginx             # list installed packages (ii = installed)
dpkg -L nginx                    # files installed by a package
dpkg -S /usr/sbin/nginx          # which package owns a file
```

## 6. Repositories: `sources.list` और `sources.list.d`

- `/etc/apt/sources.list` – मुख्य Ubuntu repositories (22.04)।
- `/etc/apt/sources.list.d/*.list` या `*.sources` – अतिरिक्त repositories। Ubuntu 24.04 ने मुख्य list को `/etc/apt/sources.list.d/ubuntu.sources` (deb822 format) में भेज दिया है।

### Signed Key के साथ Repository जोड़ना (keyrings pattern)

`apt-key` deprecated है। हर vendor की key `/etc/apt/keyrings/` में रखें और `signed-by` से उसका हवाला दें, ताकि key **सिर्फ़** उसी repository के लिए भरोसेमंद हो।

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
```

Ubuntu पर PPAs के लिए `sudo add-apt-repository ppa:owner/name` यह सब अपने आप कर देता है।

## 7. Packages को Hold करना

किसी package को upgrade होने से रोकें (जैसे pinned Kubernetes या database version):

```bash
sudo apt-mark hold kubelet
apt-mark showhold
# kubelet
sudo apt-mark unhold kubelet
```

## 8. Non-Interactive Installs (Scripts और Dockerfiles)

`-y` prompt का जवाब yes देता है। `DEBIAN_FRONTEND=noninteractive` `tzdata` जैसे packages को configuration dialog खोलने से रोकता है, जो script या `docker build` को अटका देता है।

```dockerfile
FROM ubuntu:24.04
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

`update` और `install` को **एक ही** `RUN` layer में चलाएँ, वरना Docker पुराना index cache कर लेता है।

## 9. दूसरे Distributions पर समकक्ष Commands

| काम | Ubuntu / Debian (`apt`) | RHEL / Amazon Linux (`dnf` / `yum`) | Alpine (`apk`) |
| :--- | :--- | :--- | :--- |
| Index refresh | `apt update` | `dnf makecache` | `apk update` |
| Install | `apt install nginx` | `dnf install nginx` | `apk add nginx` |
| Remove | `apt remove nginx` | `dnf remove nginx` | `apk del nginx` |
| सब upgrade | `apt upgrade` | `dnf upgrade` | `apk upgrade` |
| Search | `apt search redis` | `dnf search redis` | `apk search redis` |
| इंस्टॉल list | `apt list --installed` | `dnf list installed` | `apk info` |
| Local file install | `dpkg -i x.deb` | `rpm -i x.rpm` | `apk add --allow-untrusted x.apk` |
| Prompts छोड़ना | `-y` | `-y` | (default में prompt नहीं) |

## Use Case: नया Server तैयार करना

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl wget git unzip htop ufw ca-certificates
sudo apt autoremove --purge -y
[ -f /var/run/reboot-required ] && echo "Reboot needed (new kernel)"
```

फिर users, SSH और firewall के लिए [server setup](server-setup.md) देखें, और patching को `unattended-upgrades` से automate करें, जैसा [monitoring and security](../07_System_Administration/monitoring-and-security.md) में बताया गया है।

## आम गलतियाँ

| गलती | समाधान |
| :--- | :--- |
| `Unable to locate package` | `sudo apt update` चलाएँ; नाम `apt search` से जाँचें |
| `Could not get lock /var/lib/dpkg/lock-frontend` | दूसरा apt (अक्सर unattended-upgrades) चल रहा है; इंतज़ार करें, lock delete न करें |
| `NO_PUBKEY` / `not signed` error | Repo key नहीं है या `signed-by` path गलत है |
| Script बैंगनी dialog पर अटक गई | `DEBIAN_FRONTEND=noninteractive` और `-y` इस्तेमाल करें |
| `dpkg was interrupted` | `sudo dpkg --configure -a` चलाएँ |

## Interview Questions

**Q1. `apt update` और `apt upgrade` में क्या अंतर है?**
`update` उपलब्ध packages की list refresh करता है; `upgrade` उसी list के आधार पर इंस्टॉल packages के नए versions इंस्टॉल करता है।

**Q2. `upgrade` बनाम `full-upgrade`?**
`upgrade` कभी packages नहीं हटाता, इसलिए कुछ packages रुके रह सकते हैं। `full-upgrade` बदली हुई dependencies के लिए packages हटा या जोड़ सकता है।

**Q3. `remove` बनाम `purge`?**
`remove` program हटाता है लेकिन config files रखता है; `purge` config files भी हटा देता है।

**Q4. `apt-key add` deprecated क्यों है?**
वह key को हर repository के लिए भरोसेमंद बना देता था। `signed-by` वाला keyrings pattern हर key को एक repository तक सीमित करता है।

**Q5. Dockerfile में `DEBIAN_FRONTEND=noninteractive` क्यों?**
Build में terminal नहीं होता; prompt करने वाले packages (जैसे `tzdata`) build को अटका देंगे।
