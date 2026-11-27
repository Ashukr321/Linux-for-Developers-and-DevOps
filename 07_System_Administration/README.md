# System Administration Basics

What a Linux sysadmin or DevOps engineer does daily: starting and stopping systems, managing services with systemd, and installing software with apt or dnf.

## Role of a Linux Sysadmin / DevOps Engineer

A sysadmin keeps servers **available, secure and predictable**. In DevOps teams the same skills are used, but most of the work is automated (Ansible, Terraform, CI/CD pipelines) instead of typed by hand.

| Responsibility | Typical tools |
| :--- | :--- |
| User and access management | `useradd`, `usermod`, `sudo`, SSH keys |
| Service management | `systemctl`, `journalctl` |
| Storage | `lsblk`, `mount`, `/etc/fstab`, LVM |
| Monitoring and troubleshooting | `top`, `free`, `df`, `ss`, logs |
| Security and patching | `ufw`, `fail2ban`, `apt upgrade` |
| Automation | Bash scripts, `cron`, Ansible |

Topics in this module:

- [Users and groups](users-and-groups.md)
- [Disks and mounting](disks-and-mounting.md)
- [Monitoring and security](monitoring-and-security.md)

The boot sequence (BIOS/UEFI, GRUB, kernel, systemd) is covered in [boot process](../01_Introduction/boot-process.md), and background jobs and `cron` in [scheduling](../03_Processes/scheduling.md).

## Startup and Shutdown

Modern distributions use **systemd** as PID 1. It replaces the old SysV runlevels with **targets**.

| Old runlevel | systemd target | Meaning |
| :---: | :--- | :--- |
| 0 | `poweroff.target` | Shut down |
| 1 | `rescue.target` | Single-user / maintenance |
| 3 | `multi-user.target` | Multi-user, no GUI (servers) |
| 5 | `graphical.target` | Multi-user with GUI |
| 6 | `reboot.target` | Reboot |

```bash
systemctl get-default                      # current default target
sudo systemctl set-default multi-user.target
sudo systemctl isolate rescue.target       # switch now (drops users!)

sudo shutdown -h now                       # power off immediately
sudo shutdown -r +10 "Kernel update"       # reboot in 10 minutes with a message
sudo shutdown -c                           # cancel a scheduled shutdown
sudo reboot                                # same as systemctl reboot
sudo poweroff                              # same as systemctl poweroff
last -x reboot | head -3                   # when did the box last reboot?
```

## Managing Services with systemd

A **service** (daemon) is a background program such as `nginx`, `sshd` or `docker`. systemd describes it in a **unit file**.

```bash
systemctl status nginx          # state, PID, memory, last log lines
sudo systemctl start nginx      # start now
sudo systemctl stop nginx       # stop now
sudo systemctl restart nginx    # stop + start
sudo systemctl reload nginx     # reload config without dropping connections
sudo systemctl enable nginx     # start automatically at boot
sudo systemctl enable --now nginx   # enable and start in one step
sudo systemctl disable nginx
systemctl is-active nginx; systemctl is-enabled nginx
systemctl list-units --type=service --state=failed
```

Sample `status` output:

```bash
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Mon 2026-11-23 09:12:01 UTC; 2 days ago
   Main PID: 812 (nginx)
```

### Reading service logs with journalctl

```bash
journalctl -u nginx                 # all logs of one unit
journalctl -u nginx -f              # follow live (like tail -f)
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b                # only errors since this boot
```

### A minimal unit file for your own app

```bash
# /etc/systemd/system/myapp.service
[Unit]
Description=My Node.js API
After=network.target

[Service]
User=app
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node server.js
Restart=on-failure
EnvironmentFile=/etc/myapp.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now myapp
```

## Package Managers (apt and dnf)

| Task | Debian / Ubuntu (`apt`) | RHEL / Fedora / Amazon Linux (`dnf`) |
| :--- | :--- | :--- |
| Refresh package index | `sudo apt update` | `sudo dnf check-update` |
| Install | `sudo apt install nginx` | `sudo dnf install nginx` |
| Upgrade all | `sudo apt upgrade` | `sudo dnf upgrade` |
| Remove | `sudo apt remove nginx` | `sudo dnf remove nginx` |
| Search | `apt search redis` | `dnf search redis` |
| Show info | `apt show nginx` | `dnf info nginx` |
| Which package owns a file | `dpkg -S /usr/sbin/nginx` | `rpm -qf /usr/sbin/nginx` |

## Interview Questions

**Q1. What is the difference between `enable` and `start`?**
`start` runs the service now; `enable` creates the symlink so it starts at boot. Use `enable --now` for both.

**Q2. `restart` vs `reload`?**
`restart` kills and relaunches the process (brief downtime). `reload` asks the running process to re-read its config, if the service supports it.

**Q3. You edited a unit file but the change is ignored. Why?**
systemd caches unit files. Run `sudo systemctl daemon-reload`, then restart the service.

**Q4. How do you find why a service failed to start?**
`systemctl status <name>` for the exit code and last lines, then `journalctl -u <name> -b --no-pager` for the full log.

**Q5. What replaced runlevels?**
systemd targets, e.g. `multi-user.target` (runlevel 3) and `graphical.target` (runlevel 5).
