# apt se Package Management

Ubuntu aur Debian par apt aur dpkg se software install, update aur remove karo, third-party repos safely add karo, aur commands ko dnf aur apk se match karo.

## Ye Section Kyun

Ye module practical hai: aapke paas ek fresh Ubuntu 22.04/24.04 server hai, ab use kaam ka banao. Har recipe package manager se shuru hoti hai, isliye pehle yahi seekho.

- [Nginx install aur configure karna](install-nginx.md)
- [Developer / CI machine set up karna](install-dev-tools.md)
- [Docker install karna](install-docker.md)
- [Initial server setup](server-setup.md)

In packages se start hone wali services systemd se manage hoti hain, dekho [system administration basics](../07_System_Administration/README.md).

## 1. Hamesha Pehle `apt-get update` Chalao

apt **package index ki local copy** (names, versions, download URLs) `/var/lib/apt/lists/` mein rakhta hai. `update` har repository se fresh index download karta hai. Ye kuch bhi install ya upgrade **nahi** karta.

| Command | Kya karta hai |
| :--- | :--- |
| `sudo apt update` | Sirf package index refresh karta hai |
| `sudo apt upgrade` | Installed packages upgrade karta hai; kabhi package remove nahi karta |
| `sudo apt full-upgrade` | Upgrade karta hai aur dependencies badalne par packages remove/install bhi karta hai |
| `sudo apt autoremove` | Wo dependencies hatata hai jinki ab kisi ko zaroorat nahi |

```bash
sudo apt update
# Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
# Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
# 23 packages can be upgraded. Run 'apt list --upgradable' to see them.
sudo apt upgrade -y
```

Naye server par `update` skip karoge to `E: Unable to locate package` ya `404 Not Found` milega, kyunki index purana ya khaali hai.

## 2. `apt` vs `apt-get`

`apt` friendly interactive front end hai (progress bar, colours). `apt-get` aur `apt-cache` ka **output aur interface stable** hai, isliye scripts mein inhe use karo. apt khud warning deta hai: "apt does not have a stable CLI interface".

## 3. Install, Remove, Purge

```bash
sudo apt install nginx curl git        # install one or more packages
sudo apt install nginx=1.24.0-2ubuntu7 # install a specific version
sudo apt remove nginx                  # remove binaries, keep config in /etc
sudo apt purge nginx                   # remove binaries AND config files
sudo apt autoremove --purge            # clean orphaned dependencies
sudo apt clean                         # empty the .deb cache in /var/cache/apt/archives
```

## 4. Search aur Inspect

```bash
apt search redis                 # search names and descriptions
apt show nginx                   # version, size, dependencies, homepage
apt list --installed | grep nginx
# nginx/noble-updates,now 1.24.0-2ubuntu7.1 amd64 [installed]
apt list --upgradable
apt-cache policy nginx           # installed vs candidate version and source repo
```

## 5. dpkg: Low-Level Tool

apt dependencies resolve karta hai aur download karta hai; **dpkg** sirf ek local `.deb` file install karta hai.

```bash
sudo dpkg -i package.deb         # install a local .deb (no dependency resolution)
sudo apt-get install -f          # fix missing dependencies after dpkg -i
sudo apt install ./package.deb   # better: apt installs the .deb with dependencies
dpkg -l | grep nginx             # list installed packages (ii = installed)
dpkg -L nginx                    # files installed by a package
dpkg -S /usr/sbin/nginx          # which package owns a file
```

## 6. Repositories: `sources.list` aur `sources.list.d`

- `/etc/apt/sources.list` – main Ubuntu repositories (22.04).
- `/etc/apt/sources.list.d/*.list` ya `*.sources` – extra repositories. Ubuntu 24.04 ne main list ko `/etc/apt/sources.list.d/ubuntu.sources` (deb822 format) mein shift kar diya.

### Signed Key ke saath Repository Add Karna (keyrings pattern)

`apt-key` deprecated hai. Har vendor ki key `/etc/apt/keyrings/` mein rakho aur `signed-by` se refer karo, taaki key **sirf** usi repository ke liye trusted ho.

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
```

Ubuntu par PPAs ke liye `sudo add-apt-repository ppa:owner/name` ye sab aapke liye kar deta hai.

## 7. Packages Hold Karna

Kisi package ko upgrade hone se roko (jaise pinned Kubernetes ya database version):

```bash
sudo apt-mark hold kubelet
apt-mark showhold
# kubelet
sudo apt-mark unhold kubelet
```

## 8. Non-Interactive Installs (Scripts aur Dockerfiles)

`-y` prompt ka jawab yes deta hai. `DEBIAN_FRONTEND=noninteractive` `tzdata` jaise packages ko configuration dialog kholne se rokta hai, jo script ya `docker build` ko atka deta hai.

```dockerfile
FROM ubuntu:24.04
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

`update` aur `install` ko **ek hi** `RUN` layer mein chalao, warna Docker purana index cache kar leta hai.

## 9. Doosre Distributions par Equivalents

| Task | Ubuntu / Debian (`apt`) | RHEL / Amazon Linux (`dnf` / `yum`) | Alpine (`apk`) |
| :--- | :--- | :--- | :--- |
| Index refresh | `apt update` | `dnf makecache` | `apk update` |
| Install | `apt install nginx` | `dnf install nginx` | `apk add nginx` |
| Remove | `apt remove nginx` | `dnf remove nginx` | `apk del nginx` |
| Sab upgrade | `apt upgrade` | `dnf upgrade` | `apk upgrade` |
| Search | `apt search redis` | `dnf search redis` | `apk search redis` |
| Installed list | `apt list --installed` | `dnf list installed` | `apk info` |
| Local file install | `dpkg -i x.deb` | `rpm -i x.rpm` | `apk add --allow-untrusted x.apk` |
| Prompts skip | `-y` | `-y` | (default mein prompt nahi) |

## Use Case: Naya Server Taiyaar Karna

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl wget git unzip htop ufw ca-certificates
sudo apt autoremove --purge -y
[ -f /var/run/reboot-required ] && echo "Reboot needed (new kernel)"
```

Phir users, SSH aur firewall ke liye [server setup](server-setup.md) follow karo, aur patching ko `unattended-upgrades` se automate karo jaise [monitoring and security](../07_System_Administration/monitoring-and-security.md) mein dikhaya hai.

## Common Mistakes

| Galti | Fix |
| :--- | :--- |
| `Unable to locate package` | `sudo apt update` chalao; naam `apt search` se check karo |
| `Could not get lock /var/lib/dpkg/lock-frontend` | Doosra apt (aksar unattended-upgrades) chal raha hai; wait karo, lock delete mat karo |
| `NO_PUBKEY` / `not signed` error | Repo key missing hai ya `signed-by` path galat hai |
| Script purple dialog par atak gayi | `DEBIAN_FRONTEND=noninteractive` aur `-y` use karo |
| `dpkg was interrupted` | `sudo dpkg --configure -a` chalao |

## Interview Questions

**Q1. `apt update` aur `apt upgrade` mein kya fark hai?**
`update` available packages ki list refresh karta hai; `upgrade` us list ke basis par installed packages ke naye versions install karta hai.

**Q2. `upgrade` vs `full-upgrade`?**
`upgrade` kabhi packages remove nahi karta, isliye kuch packages hold back ho sakte hain. `full-upgrade` badli hui dependencies ke liye packages remove ya add kar sakta hai.

**Q3. `remove` vs `purge`?**
`remove` program hatata hai lekin config files rakhta hai; `purge` config files bhi hata deta hai.

**Q4. `apt-key add` deprecated kyun hai?**
Wo key ko har repository ke liye trust kar deta tha. `signed-by` wala keyrings pattern har key ko ek repository tak limit karta hai.

**Q5. Dockerfile mein `DEBIAN_FRONTEND=noninteractive` kyun?**
Build mein terminal nahi hota; prompt karne wale packages (jaise `tzdata`) build ko atka denge.
