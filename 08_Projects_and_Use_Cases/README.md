# Package Management with apt

Install, update and remove software on Ubuntu and Debian with apt and dpkg, add third-party repositories safely, and map the commands to dnf and apk.

## Why This Section

This module is practical: you have a fresh Ubuntu 22.04/24.04 server, now make it useful. Every recipe starts with the package manager, so learn it first.

- [Install and configure Nginx](install-nginx.md)
- [Set up a developer / CI machine](install-dev-tools.md)
- [Install Docker](install-docker.md)
- [Initial server setup](server-setup.md)

Services started by these packages are managed with systemd, see [system administration basics](../07_System_Administration/README.md).

## 1. Always Run `apt-get update` First

apt keeps a **local copy of the package index** (names, versions, download URLs) in `/var/lib/apt/lists/`. `update` downloads a fresh index from every repository. It does **not** install or upgrade anything.

| Command | What it does |
| :--- | :--- |
| `sudo apt update` | Refresh the package index only |
| `sudo apt upgrade` | Upgrade installed packages; never removes packages |
| `sudo apt full-upgrade` | Upgrade and remove/install packages when dependencies change |
| `sudo apt autoremove` | Remove dependencies nobody needs any more |

```bash
sudo apt update
# Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
# Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
# 23 packages can be upgraded. Run 'apt list --upgradable' to see them.
sudo apt upgrade -y
```

Skipping `update` on a new server gives `E: Unable to locate package` or `404 Not Found` because the index is stale or empty.

## 2. `apt` vs `apt-get`

`apt` is the friendly interactive front end (progress bar, colours). `apt-get` and `apt-cache` have a **stable output and interface**, so use them in scripts. apt itself warns: "apt does not have a stable CLI interface".

## 3. Install, Remove, Purge

```bash
sudo apt install nginx curl git        # install one or more packages
sudo apt install nginx=1.24.0-2ubuntu7 # install a specific version
sudo apt remove nginx                  # remove binaries, keep config in /etc
sudo apt purge nginx                   # remove binaries AND config files
sudo apt autoremove --purge            # clean orphaned dependencies
sudo apt clean                         # empty the .deb cache in /var/cache/apt/archives
```

## 4. Search and Inspect

```bash
apt search redis                 # search names and descriptions
apt show nginx                   # version, size, dependencies, homepage
apt list --installed | grep nginx
# nginx/noble-updates,now 1.24.0-2ubuntu7.1 amd64 [installed]
apt list --upgradable
apt-cache policy nginx           # installed vs candidate version and source repo
```

## 5. dpkg: The Low-Level Tool

apt resolves dependencies and downloads; **dpkg** only installs a local `.deb` file.

```bash
sudo dpkg -i package.deb         # install a local .deb (no dependency resolution)
sudo apt-get install -f          # fix missing dependencies after dpkg -i
sudo apt install ./package.deb   # better: apt installs the .deb with dependencies
dpkg -l | grep nginx             # list installed packages (ii = installed)
dpkg -L nginx                    # files installed by a package
dpkg -S /usr/sbin/nginx          # which package owns a file
```

## 6. Repositories: `sources.list` and `sources.list.d`

- `/etc/apt/sources.list` – main Ubuntu repositories (22.04).
- `/etc/apt/sources.list.d/*.list` or `*.sources` – extra repositories. Ubuntu 24.04 moved the main list to `/etc/apt/sources.list.d/ubuntu.sources` (deb822 format).

### Adding a Repository with a Signed Key (keyrings pattern)

`apt-key` is deprecated. Store each vendor key in `/etc/apt/keyrings/` and reference it with `signed-by`, so the key is trusted **only** for that repository.

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
```

For PPAs on Ubuntu, `sudo add-apt-repository ppa:owner/name` does all of this for you.

## 7. Holding Packages

Stop a package from being upgraded (for example a pinned Kubernetes or database version):

```bash
sudo apt-mark hold kubelet
apt-mark showhold
# kubelet
sudo apt-mark unhold kubelet
```

## 8. Non-Interactive Installs (Scripts and Dockerfiles)

`-y` answers yes to the prompt. `DEBIAN_FRONTEND=noninteractive` stops packages such as `tzdata` from opening a configuration dialog that hangs a script or a `docker build`.

```dockerfile
FROM ubuntu:24.04
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
```

Run `update` and `install` in the **same** `RUN` layer, otherwise Docker caches an old index.

## 9. Equivalents on Other Distributions

| Task | Ubuntu / Debian (`apt`) | RHEL / Amazon Linux (`dnf` / `yum`) | Alpine (`apk`) |
| :--- | :--- | :--- | :--- |
| Refresh index | `apt update` | `dnf makecache` | `apk update` |
| Install | `apt install nginx` | `dnf install nginx` | `apk add nginx` |
| Remove | `apt remove nginx` | `dnf remove nginx` | `apk del nginx` |
| Upgrade all | `apt upgrade` | `dnf upgrade` | `apk upgrade` |
| Search | `apt search redis` | `dnf search redis` | `apk search redis` |
| List installed | `apt list --installed` | `dnf list installed` | `apk info` |
| Install local file | `dpkg -i x.deb` | `rpm -i x.rpm` | `apk add --allow-untrusted x.apk` |
| Skip prompts | `-y` | `-y` | (no prompt by default) |

## Use Case: Preparing a New Server

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl wget git unzip htop ufw ca-certificates
sudo apt autoremove --purge -y
[ -f /var/run/reboot-required ] && echo "Reboot needed (new kernel)"
```

Then follow [server setup](server-setup.md) for users, SSH and firewall, and automate patching with `unattended-upgrades` as shown in [monitoring and security](../07_System_Administration/monitoring-and-security.md).

## Common Mistakes

| Mistake | Fix |
| :--- | :--- |
| `Unable to locate package` | Run `sudo apt update`; check the name with `apt search` |
| `Could not get lock /var/lib/dpkg/lock-frontend` | Another apt (often unattended-upgrades) is running; wait, do not delete the lock |
| `NO_PUBKEY` / `not signed` error | The repo key is missing or the `signed-by` path is wrong |
| Script hangs on a purple dialog | Use `DEBIAN_FRONTEND=noninteractive` and `-y` |
| `dpkg was interrupted` | Run `sudo dpkg --configure -a` |

## Interview Questions

**Q1. What is the difference between `apt update` and `apt upgrade`?**
`update` refreshes the list of available packages; `upgrade` installs newer versions of installed packages using that list.

**Q2. `upgrade` vs `full-upgrade`?**
`upgrade` never removes packages, so it may hold some back. `full-upgrade` can remove or add packages to satisfy changed dependencies.

**Q3. `remove` vs `purge`?**
`remove` deletes the program but keeps its config files; `purge` deletes config files too.

**Q4. Why is `apt-key add` deprecated?**
It trusted a key for every repository. The keyrings pattern with `signed-by` limits each key to one repository.

**Q5. Why use `DEBIAN_FRONTEND=noninteractive` in a Dockerfile?**
A build has no terminal; packages that prompt (like `tzdata`) would hang the build.
