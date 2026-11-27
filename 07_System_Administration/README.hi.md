# सिस्टम एडमिनिस्ट्रेशन की मूल बातें

Linux sysadmin या DevOps इंजीनियर रोज़ क्या करता है: सिस्टम चालू और बंद करना, systemd से services संभालना, और apt या dnf से software इंस्टॉल करना।

## Linux Sysadmin / DevOps इंजीनियर की भूमिका

Sysadmin का काम servers को **उपलब्ध, सुरक्षित और भरोसेमंद** रखना है। DevOps टीमों में यही skills इस्तेमाल होती हैं, लेकिन ज़्यादातर काम हाथ से टाइप करने के बजाय automate किया जाता है (Ansible, Terraform, CI/CD pipelines)।

| ज़िम्मेदारी | आम tools |
| :--- | :--- |
| User और access management | `useradd`, `usermod`, `sudo`, SSH keys |
| Service management | `systemctl`, `journalctl` |
| Storage | `lsblk`, `mount`, `/etc/fstab`, LVM |
| Monitoring और troubleshooting | `top`, `free`, `df`, `ss`, logs |
| Security और patching | `ufw`, `fail2ban`, `apt upgrade` |
| Automation | Bash scripts, `cron`, Ansible |

इस module के topics:

- [Users और groups](users-and-groups.md)
- [Disks और mounting](disks-and-mounting.md)
- [Monitoring और security](monitoring-and-security.md)

Boot sequence (BIOS/UEFI, GRUB, kernel, systemd) [boot process](../01_Introduction/boot-process.md) में है, और background jobs व `cron` [scheduling](../03_Processes/scheduling.md) में।

## Startup और Shutdown

आधुनिक distributions में **systemd** PID 1 होता है। इसने पुराने SysV runlevels की जगह **targets** ले ली है।

| पुराना runlevel | systemd target | मतलब |
| :---: | :--- | :--- |
| 0 | `poweroff.target` | बंद करना |
| 1 | `rescue.target` | Single-user / maintenance |
| 3 | `multi-user.target` | Multi-user, बिना GUI (servers) |
| 5 | `graphical.target` | GUI के साथ multi-user |
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

## systemd से Services संभालना

**Service** (daemon) एक background program है, जैसे `nginx`, `sshd` या `docker`। systemd इसे एक **unit file** में describe करता है।

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

`status` का sample output:

```bash
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Mon 2026-11-23 09:12:01 UTC; 2 days ago
   Main PID: 812 (nginx)
```

### journalctl से service logs पढ़ना

```bash
journalctl -u nginx                 # all logs of one unit
journalctl -u nginx -f              # follow live (like tail -f)
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b                # only errors since this boot
```

### अपने app के लिए एक छोटी unit file

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

## Package Managers (apt और dnf)

| काम | Debian / Ubuntu (`apt`) | RHEL / Fedora / Amazon Linux (`dnf`) |
| :--- | :--- | :--- |
| Package index refresh | `sudo apt update` | `sudo dnf check-update` |
| Install | `sudo apt install nginx` | `sudo dnf install nginx` |
| सब upgrade | `sudo apt upgrade` | `sudo dnf upgrade` |
| Remove | `sudo apt remove nginx` | `sudo dnf remove nginx` |
| Search | `apt search redis` | `dnf search redis` |
| Info देखना | `apt show nginx` | `dnf info nginx` |
| File किस package की है | `dpkg -S /usr/sbin/nginx` | `rpm -qf /usr/sbin/nginx` |

## इंटरव्यू प्रश्न

**Q1. `enable` और `start` में क्या फ़र्क है?**
`start` service को अभी चलाता है; `enable` symlink बनाता है ताकि service boot पर शुरू हो। दोनों के लिए `enable --now` इस्तेमाल करें।

**Q2. `restart` बनाम `reload`?**
`restart` process को बंद करके फिर चलाता है (थोड़ा downtime)। `reload` चल रहे process से config दोबारा पढ़ने को कहता है, अगर service इसे support करती हो।

**Q3. आपने unit file बदली लेकिन बदलाव लागू नहीं हुआ। क्यों?**
systemd unit files को cache करता है। `sudo systemctl daemon-reload` चलाएँ, फिर service restart करें।

**Q4. Service start क्यों fail हुई, यह कैसे पता करें?**
Exit code और आख़िरी lines के लिए `systemctl status <name>`, फिर पूरे log के लिए `journalctl -u <name> -b --no-pager`।

**Q5. Runlevels की जगह किसने ली?**
systemd targets ने, जैसे `multi-user.target` (runlevel 3) और `graphical.target` (runlevel 5)।
