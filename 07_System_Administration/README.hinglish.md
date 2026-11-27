# System Administration ki Basics

Linux sysadmin ya DevOps engineer roz kya karta hai: system start aur shutdown, systemd se services manage karna, aur apt ya dnf se software install karna.

## Linux Sysadmin / DevOps Engineer ka Role

Sysadmin ka kaam servers ko **available, secure aur predictable** rakhna hai. DevOps teams mein yahi skills use hoti hain, bas zyada tar kaam haath se type karne ke bajaye automate hota hai (Ansible, Terraform, CI/CD pipelines).

| Zimmedari | Common tools |
| :--- | :--- |
| User aur access management | `useradd`, `usermod`, `sudo`, SSH keys |
| Service management | `systemctl`, `journalctl` |
| Storage | `lsblk`, `mount`, `/etc/fstab`, LVM |
| Monitoring aur troubleshooting | `top`, `free`, `df`, `ss`, logs |
| Security aur patching | `ufw`, `fail2ban`, `apt upgrade` |
| Automation | Bash scripts, `cron`, Ansible |

Is module ke topics:

- [Users aur groups](users-and-groups.md)
- [Disks aur mounting](disks-and-mounting.md)
- [Monitoring aur security](monitoring-and-security.md)

Boot sequence (BIOS/UEFI, GRUB, kernel, systemd) [boot process](../01_Introduction/boot-process.md) mein hai, aur background jobs va `cron` [scheduling](../03_Processes/scheduling.md) mein.

## Startup aur Shutdown

Modern distributions mein **systemd** PID 1 hota hai. Isne purane SysV runlevels ki jagah **targets** le li hai.

| Purana runlevel | systemd target | Matlab |
| :---: | :--- | :--- |
| 0 | `poweroff.target` | Shut down |
| 1 | `rescue.target` | Single-user / maintenance |
| 3 | `multi-user.target` | Multi-user, bina GUI (servers) |
| 5 | `graphical.target` | GUI ke saath multi-user |
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

## systemd se Services Manage karna

**Service** (daemon) ek background program hai, jaise `nginx`, `sshd` ya `docker`. systemd use ek **unit file** mein describe karta hai.

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

`status` ka sample output:

```bash
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Mon 2026-11-23 09:12:01 UTC; 2 days ago
   Main PID: 812 (nginx)
```

### journalctl se service logs padhna

```bash
journalctl -u nginx                 # all logs of one unit
journalctl -u nginx -f              # follow live (like tail -f)
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b                # only errors since this boot
```

### Apne app ke liye ek chhoti unit file

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

## Package Managers (apt aur dnf)

| Kaam | Debian / Ubuntu (`apt`) | RHEL / Fedora / Amazon Linux (`dnf`) |
| :--- | :--- | :--- |
| Package index refresh | `sudo apt update` | `sudo dnf check-update` |
| Install | `sudo apt install nginx` | `sudo dnf install nginx` |
| Sab upgrade | `sudo apt upgrade` | `sudo dnf upgrade` |
| Remove | `sudo apt remove nginx` | `sudo dnf remove nginx` |
| Search | `apt search redis` | `dnf search redis` |
| Info dekhna | `apt show nginx` | `dnf info nginx` |
| File kis package ki hai | `dpkg -S /usr/sbin/nginx` | `rpm -qf /usr/sbin/nginx` |

## Interview Questions

**Q1. `enable` aur `start` mein kya fark hai?**
`start` service ko abhi chalata hai; `enable` symlink banata hai taaki service boot par start ho. Dono ke liye `enable --now` use karo.

**Q2. `restart` vs `reload`?**
`restart` process ko band karke phir chalata hai (thoda downtime). `reload` chal rahe process ko config dobara padhne ko kehta hai, agar service support kare.

**Q3. Unit file badli lekin change apply nahi hua. Kyun?**
systemd unit files cache karta hai. `sudo systemctl daemon-reload` chalao, phir service restart karo.

**Q4. Service start kyun fail hui, kaise pata karein?**
Exit code aur last lines ke liye `systemctl status <name>`, phir poore log ke liye `journalctl -u <name> -b --no-pager`.

**Q5. Runlevels ki jagah kisne li?**
systemd targets ne, jaise `multi-user.target` (runlevel 3) aur `graphical.target` (runlevel 5).
